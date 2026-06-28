import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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
      .select('id, perfil, ativo')
      .eq('id', user.id)
      .single()

    if (callerProfileError || !callerProfile) {
      return jsonResponse({ error: 'Perfil do usuário solicitante não encontrado' }, 403)
    }

    const perfisPermitidos = ['dev', 'super_admin', 'admin', 'instrutor', 'recepcao']

    if (!callerProfile.ativo || !perfisPermitidos.includes(callerProfile.perfil)) {
      return jsonResponse({ error: 'Usuário sem permissão para criar acesso de aluno' }, 403)
    }

    const body = await req.json()

    const clienteId = String(body.cliente_id || '').trim()
    const email = String(body.email || '')
      .trim()
      .toLowerCase()
    const nome = String(body.nome || '').trim()
    const senhaTemporaria = gerarSenhaTemporaria()

    if (!clienteId) {
      return jsonResponse({ error: 'cliente_id é obrigatório' }, 400)
    }

    if (!email) {
      return jsonResponse({ error: 'E-mail é obrigatório' }, 400)
    }

    if (!nome) {
      return jsonResponse({ error: 'Nome é obrigatório' }, 400)
    }

    const { data: cliente, error: clienteError } = await adminClient
      .from('clientes')
      .select('id, nome, email')
      .eq('id', clienteId)
      .single()

    if (clienteError || !cliente) {
      return jsonResponse({ error: 'Cliente não encontrado' }, 404)
    }

    const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email,
      password: senhaTemporaria,
      email_confirm: true,
      user_metadata: {
        nome,
        perfil: 'aluno',
        cliente_id: clienteId,
      },
    })

    if (createUserError) {
      return jsonResponse({ error: createUserError.message }, 400)
    }

    const authUser = createdUser.user

    if (!authUser?.id) {
      return jsonResponse({ error: 'Usuário Auth não retornado pelo Supabase' }, 500)
    }

    const { error: profileError } = await adminClient.from('profiles').upsert(
      {
        id: authUser.id,
        nome,
        perfil: 'aluno',
        cliente_id: clienteId,
        ativo: true,
        precisa_trocar_senha: true,
      },
      {
        onConflict: 'id',
      },
    )

    if (profileError) {
      return jsonResponse({ error: profileError.message }, 500)
    }

    const { error: clienteUpdateError } = await adminClient
      .from('clientes')
      .update({
        email,
      })
      .eq('id', clienteId)

    if (clienteUpdateError) {
      return jsonResponse({ error: clienteUpdateError.message }, 500)
    }

    return jsonResponse({
      success: true,
      user_id: authUser.id,
      cliente_id: clienteId,
      email,
      senha_temporaria: senhaTemporaria,
    })
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Erro inesperado ao criar acesso do aluno',
      },
      500,
    )
  }
})

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
