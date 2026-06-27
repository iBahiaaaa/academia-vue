import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PERFIS = {
  DEV: 'dev',
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  INSTRUTOR: 'instrutor',
  RECEPCAO: 'recepcao',
  FINANCEIRO: 'financeiro',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return jsonResponse({ ok: true })
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Método não permitido' }, 405)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return jsonResponse({ error: 'Variáveis do Supabase não configuradas' }, 500)
    }

    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return jsonResponse({ error: 'Token de autorização não informado' }, 401)
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return jsonResponse({ error: 'Usuário não autenticado' }, 401)
    }

    const { data: callerProfile, error: callerProfileError } = await adminClient
      .from('profiles')
      .select('id, nome, perfil, ativo')
      .eq('id', user.id)
      .single()

    if (callerProfileError || !callerProfile) {
      return jsonResponse({ error: 'Perfil do usuário solicitante não encontrado' }, 403)
    }

    if (!callerProfile.ativo) {
      return jsonResponse({ error: 'Usuário solicitante está inativo' }, 403)
    }

    const body = await req.json()

    const nome = String(body.nome || '').trim()
    const email = String(body.email || '')
      .trim()
      .toLowerCase()
    const telefone = String(body.telefone || '').trim()
    const perfilNovo = String(body.perfil || '').trim()
    const cargoNome = String(body.cargo_nome || '').trim()
    const senhaConfirmacao = String(body.senha_confirmacao || '').trim()

    if (!nome) {
      return jsonResponse({ error: 'Nome é obrigatório' }, 400)
    }

    if (!email) {
      return jsonResponse({ error: 'E-mail é obrigatório' }, 400)
    }

    if (!perfilNovo) {
      return jsonResponse({ error: 'Perfil é obrigatório' }, 400)
    }

    if (!isPerfilFuncionario(perfilNovo)) {
      return jsonResponse({ error: 'Perfil inválido para funcionário' }, 400)
    }

    if (!podeCriarPerfil(callerProfile.perfil, perfilNovo)) {
      return jsonResponse({ error: 'Você não tem permissão para criar este perfil' }, 403)
    }

    if (perfilExigeConfirmacaoSenha(perfilNovo)) {
      if (!senhaConfirmacao) {
        return jsonResponse({ error: 'Confirme sua senha para criar este perfil' }, 400)
      }

      const { error: confirmError } = await userClient.auth.signInWithPassword({
        email: user.email || '',
        password: senhaConfirmacao,
      })

      if (confirmError) {
        return jsonResponse({ error: 'Senha de confirmação inválida' }, 403)
      }
    }

    const senhaTemporaria = gerarSenhaTemporaria()

    const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email,
      password: senhaTemporaria,
      email_confirm: true,
      user_metadata: {
        nome,
        perfil: perfilNovo,
      },
    })

    if (createUserError) {
      const message = createUserError.message || ''

      if (
        message.toLowerCase().includes('already') ||
        message.toLowerCase().includes('registered') ||
        message.toLowerCase().includes('exists')
      ) {
        return jsonResponse(
          {
            error:
              'Este e-mail já está cadastrado no sistema. Use outro e-mail ou verifique se essa pessoa já é aluno/funcionário.',
          },
          400,
        )
      }

      return jsonResponse({ error: message }, 400)
    }

    const authUser = createdUser.user

    if (!authUser?.id) {
      return jsonResponse({ error: 'Usuário Auth não retornado pelo Supabase' }, 500)
    }

    const { error: profileError } = await adminClient.from('profiles').upsert(
      {
        id: authUser.id,
        nome,
        perfil: perfilNovo,
        cargo_nome: cargoNome || null,
        telefone: telefone || null,
        cliente_id: null,
        ativo: true,
        precisa_trocar_senha: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'id',
      },
    )

    if (profileError) {
      return jsonResponse({ error: profileError.message }, 500)
    }

    return jsonResponse({
      success: true,
      user_id: authUser.id,
      email,
      perfil: perfilNovo,
      senha_temporaria: senhaTemporaria,
    })
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Erro inesperado ao criar funcionário',
      },
      500,
    )
  }
})

function isPerfilFuncionario(perfil: string) {
  return [
    PERFIS.DEV,
    PERFIS.SUPER_ADMIN,
    PERFIS.ADMIN,
    PERFIS.INSTRUTOR,
    PERFIS.RECEPCAO,
    PERFIS.FINANCEIRO,
  ].includes(perfil)
}

function podeCriarPerfil(perfilAtual: string, perfilNovo: string) {
  if (perfilAtual === PERFIS.DEV) {
    return true
  }

  if (perfilAtual === PERFIS.SUPER_ADMIN) {
    return [PERFIS.ADMIN, PERFIS.INSTRUTOR, PERFIS.RECEPCAO, PERFIS.FINANCEIRO].includes(perfilNovo)
  }

  if (perfilAtual === PERFIS.ADMIN) {
    return [PERFIS.INSTRUTOR, PERFIS.RECEPCAO, PERFIS.FINANCEIRO].includes(perfilNovo)
  }

  return false
}

function perfilExigeConfirmacaoSenha(perfil: string) {
  return [PERFIS.DEV, PERFIS.SUPER_ADMIN, PERFIS.ADMIN].includes(perfil)
}

function gerarSenhaTemporaria() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const bytes = new Uint8Array(6)

  crypto.getRandomValues(bytes)

  return Array.from(bytes)
    .map((byte) => chars[byte % chars.length])
    .join('')
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}
