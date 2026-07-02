<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">Funcionários</div>
        <div class="text-grey-7">
          Gerencie usuários administrativos, cargos e acessos do sistema
        </div>
      </div>

      <q-btn
        color="primary"
        icon="person_add"
        label="Novo funcionário"
        unelevated
        :disable="!authStore.canManageFuncionarios"
        @click="openCreateModal"
      />
    </div>

    <q-card flat bordered>
      <q-card-section>
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-md-5">
            <q-input
              v-model="filters.search"
              outlined
              dense
              clearable
              debounce="300"
              placeholder="Buscar por nome, e-mail ou telefone"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.perfil"
              outlined
              dense
              emit-value
              map-options
              label="Perfil"
              :options="perfilFilterOptions"
            />
          </div>

          <div class="col-12 col-md-2">
            <q-select
              v-model="filters.status"
              outlined
              dense
              emit-value
              map-options
              label="Status"
              :options="statusOptions"
            />
          </div>

          <div class="col-12 col-md-2 text-right">
            <q-btn
              flat
              icon="refresh"
              label="Atualizar"
              :loading="loading"
              @click="loadFuncionarios"
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-table
        flat
        :rows="funcionariosFiltrados"
        :columns="columns"
        row-key="id"
        :loading="loading"
        no-data-label="Nenhum funcionário encontrado"
        rows-per-page-label="Registros por página"
        :pagination="{ rowsPerPage: 10 }"
      >
        <template #body-cell-perfil="props">
          <q-td :props="props">
            <q-badge
              :color="getPerfilColor(props.row.perfil)"
              :label="getPerfilLabel(props.row.perfil)"
              class="q-pa-xs"
            />
          </q-td>
        </template>

        <template #body-cell-ativo="props">
          <q-td :props="props">
            <q-badge
              :color="props.row.ativo ? 'positive' : 'grey'"
              :label="props.row.ativo ? 'Ativo' : 'Inativo'"
              class="q-pa-xs"
            />
          </q-td>
        </template>

        <template #body-cell-created_at="props">
          <q-td :props="props">
            {{ formatDate(props.row.created_at) }}
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props" class="text-right">
            <q-btn
              flat
              round
              dense
              color="primary"
              icon="edit"
              :disable="!canEditFuncionario(props.row)"
              @click="openEditModal(props.row)"
            >
              <q-tooltip>Editar</q-tooltip>
            </q-btn>

            <q-btn
              v-if="props.row.ativo"
              flat
              round
              dense
              color="warning"
              icon="block"
              :disable="!canEditFuncionario(props.row)"
              @click="confirmAlterarStatus(props.row, false)"
            >
              <q-tooltip>Desativar</q-tooltip>
            </q-btn>

            <q-btn
              v-else
              flat
              round
              dense
              color="positive"
              icon="check_circle"
              :disable="!canEditFuncionario(props.row)"
              @click="confirmAlterarStatus(props.row, true)"
            >
              <q-tooltip>Ativar</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="modal.open" persistent>
      <q-card style="width: 680px; max-width: 95vw">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6">
              {{ modal.isEdit ? 'Editar funcionário' : 'Novo funcionário' }}
            </div>
            <div class="text-grey-7">
              {{ modal.isEdit ? 'Altere cargo, telefone e status' : 'Crie um novo acesso administrativo' }}
            </div>
          </div>

          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-form @submit.prevent="saveFuncionario">
          <q-card-section class="q-gutter-md">
            <q-banner
              v-if="!authStore.canManageFuncionarios"
              rounded
              class="bg-red-1 text-red-10"
            >
              Seu perfil não tem permissão para gerenciar funcionários.
            </q-banner>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.nome"
                  outlined
                  dense
                  label="Nome"
                  :disable="saving || modal.isEdit"
                  lazy-rules
                  :rules="[(val) => !!val || 'Informe o nome']"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.email"
                  outlined
                  dense
                  label="E-mail"
                  type="email"
                  :disable="saving || modal.isEdit"
                  lazy-rules
                  :rules="[(val) => !!val || 'Informe o e-mail']"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.telefone"
                  outlined
                  dense
                  label="Telefone"
                  :disable="saving"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-select
                  v-model="form.perfil"
                  outlined
                  dense
                  emit-value
                  map-options
                  label="Perfil/Cargo"
                  :disable="saving || !canChangePerfil"
                  :options="perfilOptionsPermitidas"
                  lazy-rules
                  :rules="[(val) => !!val || 'Informe o perfil']"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.cargo_nome"
                  outlined
                  dense
                  label="Nome do cargo"
                  placeholder="Ex: Instrutor manhã, Gerente, Financeiro..."
                  :disable="saving"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-toggle
                  v-model="form.ativo"
                  label="Funcionário ativo"
                  color="positive"
                  :disable="saving"
                />
              </div>

              <div class="col-12">
                <q-banner rounded class="bg-blue-1 text-blue-10">
                  Ao criar um funcionário, o sistema vai gerar uma senha temporária de 6 caracteres.
                  No primeiro login, o funcionário deverá trocar a senha.
                </q-banner>
              </div>

              <div
                v-if="perfilSelecionadoExigeConfirmacao"
                class="col-12"
              >
                <q-banner rounded class="bg-orange-1 text-orange-10 q-mb-md">
                  Este perfil é crítico. Para criar ou alterar para
                  <strong>{{ getPerfilLabel(form.perfil) }}</strong>, confirme sua senha atual.
                </q-banner>

                <q-input
                  v-model="form.senha_confirmacao"
                  outlined
                  dense
                  label="Sua senha atual"
                  type="password"
                  :disable="saving"
                  lazy-rules
                  :rules="[(val) => !!val || 'Informe sua senha para confirmar']"
                />
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn
              flat
              label="Cancelar"
              :disable="saving"
              v-close-popup
            />

            <q-btn
              color="primary"
              unelevated
              type="submit"
              :label="modal.isEdit ? 'Salvar alterações' : 'Criar acesso'"
              :loading="saving"
              :disable="!authStore.canManageFuncionarios"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="senhaCriadaModal.open" persistent>
      <q-card style="width: 520px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">Acesso criado</div>
          <div class="text-grey-7">
            Funcionário criado com sucesso.
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <p>
            Envie a senha temporária para o funcionário. Ele deverá trocá-la no primeiro acesso.
          </p>

          <div class="senha-box">
            <div>
              <div class="text-caption text-grey-7">Senha temporária</div>
              <code class="senha-code">{{ senhaCriadaModal.senha }}</code>
            </div>

            <q-btn
              color="primary"
              icon="content_copy"
              label="Copiar"
              unelevated
              @click="copySenhaTemporaria"
            />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn
            color="primary"
            unelevated
            label="Entendi"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { apiRequest } from 'src/services/api-client'
import { useAuthStore } from 'src/stores/auth-store'
import {
  PERFIS,
  PERFIL_OPTIONS_FUNCIONARIOS,
  getPerfilColor,
  getPerfilLabel,
  podeCriarPerfil,
  perfilExigeConfirmacaoSenha,
} from 'src/utils/perfis'

const $q = useQuasar()
const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const funcionarios = ref([])

const filters = reactive({
  search: '',
  perfil: 'Todos',
  status: 'Todos',
})

const modal = reactive({
  open: false,
  isEdit: false,
  funcionario: null,
})

const senhaCriadaModal = reactive({
  open: false,
  senha: '',
})

const form = reactive({
  id: null,
  nome: '',
  email: '',
  telefone: '',
  perfil: PERFIS.INSTRUTOR,
  cargo_nome: '',
  ativo: true,
  senha_confirmacao: '',
})

const statusOptions = [
  { label: 'Todos', value: 'Todos' },
  { label: 'Ativos', value: 'Ativo' },
  { label: 'Inativos', value: 'Inativo' },
]

const perfilFilterOptions = [
  { label: 'Todos', value: 'Todos' },
  ...PERFIL_OPTIONS_FUNCIONARIOS,
]

const columns = [
  {
    name: 'nome',
    label: 'Nome',
    field: 'nome',
    align: 'left',
    sortable: true,
  },
  {
    name: 'email',
    label: 'E-mail',
    field: 'email',
    align: 'left',
  },
  {
    name: 'telefone',
    label: 'Telefone',
    field: 'telefone',
    align: 'left',
  },
  {
    name: 'perfil',
    label: 'Perfil',
    field: 'perfil',
    align: 'center',
    sortable: true,
  },
  {
    name: 'cargo_nome',
    label: 'Cargo',
    field: 'cargo_nome',
    align: 'left',
  },
  {
    name: 'ativo',
    label: 'Status',
    field: 'ativo',
    align: 'center',
    sortable: true,
  },
  {
    name: 'created_at',
    label: 'Criado em',
    field: 'created_at',
    align: 'left',
    sortable: true,
  },
  {
    name: 'actions',
    label: 'Ações',
    field: 'actions',
    align: 'right',
  },
]

const funcionariosFiltrados = computed(() => {
  let result = [...funcionarios.value]

  if (filters.search?.trim()) {
    const search = filters.search.trim().toLowerCase()

    result = result.filter((funcionario) => {
      return String(funcionario.nome || '').toLowerCase().includes(search)
        || String(funcionario.email || '').toLowerCase().includes(search)
        || String(funcionario.telefone || '').toLowerCase().includes(search)
    })
  }

  if (filters.perfil !== 'Todos') {
    result = result.filter((funcionario) => funcionario.perfil === filters.perfil)
  }

  if (filters.status === 'Ativo') {
    result = result.filter((funcionario) => funcionario.ativo)
  }

  if (filters.status === 'Inativo') {
    result = result.filter((funcionario) => !funcionario.ativo)
  }

  return result
})

const perfilOptionsPermitidas = computed(() => {
  return PERFIL_OPTIONS_FUNCIONARIOS.filter((option) => {
    return podeCriarPerfil(authStore.perfil, option.value)
  })
})

const canChangePerfil = computed(() => {
  if (!modal.isEdit) {
    return true
  }

  if (!modal.funcionario) {
    return false
  }

  return canEditFuncionario(modal.funcionario)
})

const perfilSelecionadoExigeConfirmacao = computed(() => {
  return perfilExigeConfirmacaoSenha(form.perfil)
})

onMounted(async () => {
  if (!authStore.initialized) {
    await authStore.initialize()
  }

  await loadFuncionarios()
})

async function loadFuncionarios() {
  try {
    loading.value = true

    const data = await apiRequest('/funcionarios')

    funcionarios.value = data || []
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Erro ao carregar funcionários',
    })
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  resetForm()

  modal.open = true
  modal.isEdit = false
  modal.funcionario = null
}

function openEditModal(funcionario) {
  resetForm()

  modal.open = true
  modal.isEdit = true
  modal.funcionario = funcionario

  Object.assign(form, {
    id: funcionario.id,
    nome: funcionario.nome || '',
    email: funcionario.email || '',
    telefone: funcionario.telefone || '',
    perfil: funcionario.perfil || PERFIS.INSTRUTOR,
    cargo_nome: funcionario.cargo_nome || '',
    ativo: !!funcionario.ativo,
    senha_confirmacao: '',
  })
}

function resetForm() {
  Object.assign(form, {
    id: null,
    nome: '',
    email: '',
    telefone: '',
    perfil: perfilOptionsPermitidas.value[0]?.value || PERFIS.INSTRUTOR,
    cargo_nome: '',
    ativo: true,
    senha_confirmacao: '',
  })
}

async function saveFuncionario() {
  if (modal.isEdit) {
    await updateFuncionario()
    return
  }

  await criarFuncionario()
}

async function criarFuncionario() {
  try {
    saving.value = true

    if (!form.nome?.trim()) {
      throw new Error('Informe o nome')
    }

    if (!form.email?.trim()) {
      throw new Error('Informe o e-mail')
    }

    if (!form.perfil) {
      throw new Error('Informe o perfil')
    }

    if (!podeCriarPerfil(authStore.perfil, form.perfil)) {
      throw new Error('Você não tem permissão para criar este perfil')
    }

    if (perfilExigeConfirmacaoSenha(form.perfil) && !form.senha_confirmacao) {
      throw new Error('Confirme sua senha para criar este perfil')
    }

    const data = await apiRequest('/funcionarios', {
      method: 'POST',
      body: {
        nome: form.nome,
        email: form.email,
        telefone: form.telefone,
        perfil: form.perfil,
        cargo_nome: form.cargo_nome,
        senha_confirmacao: form.senha_confirmacao,
      },
    })

    modal.open = false

    senhaCriadaModal.senha = data.senha_temporaria || ''
    senhaCriadaModal.open = true

    await loadFuncionarios()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Erro ao criar funcionário',
    })
  } finally {
    saving.value = false
  }
}

async function updateFuncionario() {
  try {
    saving.value = true

    if (!form.id) {
      throw new Error('Funcionário não informado')
    }

    if (!canEditFuncionario(modal.funcionario)) {
      throw new Error('Você não tem permissão para editar este funcionário')
    }

    if (!podeCriarPerfil(authStore.perfil, form.perfil)) {
      throw new Error('Você não tem permissão para definir este perfil')
    }

    if (perfilExigeConfirmacaoSenha(form.perfil) && !form.senha_confirmacao) {
      throw new Error('Confirme sua senha para alterar este perfil')
    }

    await apiRequest(`/funcionarios/${form.id}`, {
      method: 'PATCH',
      body: {
        telefone: emptyToNull(form.telefone),
        perfil: form.perfil,
        cargo_nome: emptyToNull(form.cargo_nome),
        ativo: form.ativo,
        senha_confirmacao: form.senha_confirmacao,
      },
    })

    $q.notify({
      type: 'positive',
      message: 'Funcionário atualizado com sucesso',
    })

    modal.open = false
    await loadFuncionarios()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Erro ao atualizar funcionário',
    })
  } finally {
    saving.value = false
  }
}

function confirmAlterarStatus(funcionario, ativo) {
  $q.dialog({
    title: ativo ? 'Ativar funcionário' : 'Desativar funcionário',
    message: `Deseja ${ativo ? 'ativar' : 'desativar'} o funcionário "${funcionario.nome}"?`,
    persistent: true,
    ok: {
      label: ativo ? 'Ativar' : 'Desativar',
      color: ativo ? 'positive' : 'warning',
      unelevated: true,
    },
    cancel: {
      label: 'Cancelar',
      flat: true,
    },
  }).onOk(async () => {
    await alterarStatusFuncionario(funcionario, ativo)
  })
}

async function alterarStatusFuncionario(funcionario, ativo) {
  try {
    loading.value = true

    if (!canEditFuncionario(funcionario)) {
      throw new Error('Você não tem permissão para alterar este funcionário')
    }

    await apiRequest(`/funcionarios/${funcionario.id}/status`, {
      method: 'PATCH',
      body: {
        ativo,
      },
    })

    $q.notify({
      type: 'positive',
      message: ativo ? 'Funcionário ativado' : 'Funcionário desativado',
    })

    await loadFuncionarios()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Erro ao alterar funcionário',
    })
  } finally {
    loading.value = false
  }
}

function canEditFuncionario(funcionario) {
  if (!funcionario) {
    return false
  }

  if (funcionario.id === authStore.user?.id && funcionario.perfil === PERFIS.DEV) {
    return true
  }

  if (authStore.perfil === PERFIS.DEV) {
    return true
  }

  if (funcionario.perfil === PERFIS.DEV) {
    return false
  }

  if (authStore.perfil === PERFIS.SUPER_ADMIN) {
    return funcionario.perfil !== PERFIS.DEV
  }

  if (authStore.perfil === PERFIS.ADMIN) {
    return [
      PERFIS.INSTRUTOR,
      PERFIS.RECEPCAO,
      PERFIS.FINANCEIRO,
    ].includes(funcionario.perfil)
  }

  return false
}

async function copySenhaTemporaria() {
  try {
    await navigator.clipboard.writeText(senhaCriadaModal.senha)

    $q.notify({
      type: 'positive',
      message: 'Senha copiada',
    })
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Não foi possível copiar a senha',
    })
  }
}

function emptyToNull(value) {
  if (value === undefined || value === null) {
    return null
  }

  const text = String(value).trim()

  return text === '' ? null : text
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleDateString('pt-BR')
}
</script>

<style scoped>
.senha-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px;
  border-radius: 8px;
  background: #f5f5f5;
  border: 1px solid #dddddd;
}

.senha-code {
  display: inline-block;
  margin-top: 4px;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #111111;
}
</style>
