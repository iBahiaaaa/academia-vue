export const PERFIS = {
  DEV: 'dev',
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  INSTRUTOR: 'instrutor',
  RECEPCAO: 'recepcao',
  FINANCEIRO: 'financeiro',
  ALUNO: 'aluno',
}

export const PERFIL_OPTIONS_FUNCIONARIOS = [
  {
    label: 'Dev',
    value: PERFIS.DEV,
  },
  {
    label: 'Super Admin',
    value: PERFIS.SUPER_ADMIN,
  },
  {
    label: 'Admin',
    value: PERFIS.ADMIN,
  },
  {
    label: 'Instrutor',
    value: PERFIS.INSTRUTOR,
  },
  {
    label: 'Recepção',
    value: PERFIS.RECEPCAO,
  },
  {
    label: 'Financeiro',
    value: PERFIS.FINANCEIRO,
  },
]

export function getPerfilLabel(perfil) {
  const option = PERFIL_OPTIONS_FUNCIONARIOS.find((item) => item.value === perfil)

  return option?.label || perfil || '-'
}

export function getPerfilColor(perfil) {
  if (perfil === PERFIS.DEV) {
    return 'purple'
  }

  if (perfil === PERFIS.SUPER_ADMIN) {
    return 'deep-orange'
  }

  if (perfil === PERFIS.ADMIN) {
    return 'primary'
  }

  if (perfil === PERFIS.INSTRUTOR) {
    return 'secondary'
  }

  if (perfil === PERFIS.RECEPCAO) {
    return 'teal'
  }

  if (perfil === PERFIS.FINANCEIRO) {
    return 'positive'
  }

  return 'grey'
}

export function podeGerenciarFuncionarios(perfilAtual) {
  return [
    PERFIS.DEV,
    PERFIS.SUPER_ADMIN,
    PERFIS.ADMIN,
  ].includes(perfilAtual)
}

export function podeCriarPerfil(perfilAtual, perfilNovo) {
  if (perfilAtual === PERFIS.DEV) {
    return true
  }

  if (perfilAtual === PERFIS.SUPER_ADMIN) {
    return [
      PERFIS.ADMIN,
      PERFIS.INSTRUTOR,
      PERFIS.RECEPCAO,
      PERFIS.FINANCEIRO,
    ].includes(perfilNovo)
  }

  if (perfilAtual === PERFIS.ADMIN) {
    return [
      PERFIS.INSTRUTOR,
      PERFIS.RECEPCAO,
      PERFIS.FINANCEIRO,
    ].includes(perfilNovo)
  }

  return false
}

export function perfilExigeConfirmacaoSenha(perfil) {
  return [
    PERFIS.DEV,
    PERFIS.SUPER_ADMIN,
    PERFIS.ADMIN,
  ].includes(perfil)
}
