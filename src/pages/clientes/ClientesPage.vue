<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">Clientes</div>
        <div class="text-grey-7">Gerencie os alunos/clientes da academia</div>
      </div>

      <q-btn color="primary" icon="add" label="Novo Cliente" unelevated @click="openCreateModal" />
    </div>

    <q-card flat bordered>
      <q-card-section>
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-md-6">
            <q-input
              v-model="filters.search"
              outlined
              dense
              debounce="400"
              placeholder="Buscar por nome, e-mail, telefone ou CPF"
              clearable
              @update:model-value="loadClientes"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.status"
              outlined
              dense
              emit-value
              map-options
              label="Status"
              :options="statusOptions"
              @update:model-value="loadClientes"
            />
          </div>

          <div class="col-12 col-md-3 text-right">
            <q-btn flat icon="refresh" label="Atualizar" :loading="loading" @click="loadClientes" />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-table
        flat
        :rows="clientes"
        :columns="columns"
        row-key="id"
        :loading="loading"
        no-data-label="Nenhum cliente encontrado"
        rows-per-page-label="Registros por página"
        :pagination="pagination"
      >
        <template #body-cell-data_matricula="props">
          <q-td :props="props">
            {{ formatDateOnly(props.row.data_matricula) }}
          </q-td>
        </template>

        <template #body-cell-data_ultimo_pagamento="props">
          <q-td :props="props">
            {{ formatDateOnly(props.row.data_ultimo_pagamento) }}
          </q-td>
        </template>

        <template #body-cell-data_vencimento="props">
          <q-td :props="props">
            {{ formatDateOnly(props.row.data_vencimento) }}
          </q-td>
        </template>
        <template #body-cell-status="props">
          <q-td :props="props">
            <q-badge :color="getStatusColor(props.row.status)" :label="props.row.status" />
          </q-td>
        </template>

        <template #body-cell-created_at="props">
          <q-td :props="props">
            {{ formatDate(props.row.created_at) }}
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props" class="text-right">
            <q-btn flat round dense color="primary" icon="edit" @click="openEditModal(props.row)">
              <q-tooltip>Editar</q-tooltip>
            </q-btn>

            <q-btn
              flat
              round
              dense
              color="secondary"
              icon="key"
              @click="openAcessoAlunoModal(props.row)"
            >
              <q-tooltip>Criar acesso do aluno</q-tooltip>
            </q-btn>

            <q-btn
              flat
              round
              dense
              color="negative"
              icon="delete"
              @click="confirmDelete(props.row)"
            >
              <q-tooltip>Excluir</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="modal.open" persistent>
      <q-card style="width: 700px; max-width: 95vw">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">
            {{ modal.isEdit ? 'Editar Cliente' : 'Novo Cliente' }}
          </div>

          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-form @submit.prevent="saveCliente">
          <q-card-section class="q-gutter-md">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-8">
                <q-input
                  v-model="form.nome"
                  outlined
                  dense
                  label="Nome"
                  :disable="saving"
                  lazy-rules
                  :rules="[(val) => !!val || 'Informe o nome']"
                />
              </div>

              <div class="col-12 col-md-4">
                <q-select
                  v-model="form.status"
                  outlined
                  dense
                  label="Status"
                  emit-value
                  map-options
                  :disable="saving"
                  :options="statusOptionsWithoutAll"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.email"
                  outlined
                  dense
                  label="E-mail"
                  type="email"
                  :disable="saving"
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
                <q-input v-model="form.cpf" outlined dense label="CPF" :disable="saving" />
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.data_nascimento"
                  outlined
                  dense
                  label="Data de nascimento"
                  type="date"
                  :disable="saving"
                />
              </div>
              <div class="col-12 col-md-4">
                <q-input
                  v-model="form.data_matricula"
                  outlined
                  dense
                  label="Data da matrícula"
                  type="date"
                  :disable="saving"
                />
              </div>

              <div class="col-12 col-md-4">
                <q-input
                  v-model="form.data_ultimo_pagamento"
                  outlined
                  dense
                  label="Último pagamento"
                  type="date"
                  :disable="saving"
                  @update:model-value="calcularVencimentoPorPagamento"
                />
              </div>

              <div class="col-12 col-md-4">
                <q-input
                  v-model="form.data_vencimento"
                  outlined
                  dense
                  label="Data de vencimento"
                  type="date"
                  :disable="saving"
                  @update:model-value="calcularStatusAutomatico"
                />
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn flat label="Cancelar" :disable="saving" v-close-popup />

            <q-btn color="primary" unelevated type="submit" label="Salvar" :loading="saving" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
    <q-dialog v-model="acessoAlunoModal.open" persistent>
      <q-card style="width: 520px; max-width: 95vw">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6">Acesso do aluno</div>
            <div class="text-grey-7">
              {{ acessoAlunoModal.cliente?.nome }}
            </div>
          </div>

          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-form @submit.prevent="criarAcessoAluno">
          <q-card-section class="q-gutter-md">
            <q-input
              v-model="acessoAlunoForm.email"
              outlined
              dense
              label="E-mail de acesso"
              type="email"
              lazy-rules
              :rules="[(val) => !!val || 'Informe o e-mail']"
            />

            <q-banner rounded class="bg-blue-1 text-blue-10">
              A senha temporária será gerada automaticamente com 6 caracteres. Depois, no primeiro
              acesso, o aluno deverá trocar a senha.
            </q-banner>

            <q-banner rounded class="bg-blue-1 text-blue-10">
              Esse botão será ligado a uma Edge Function para criar o usuário no Supabase Auth com
              segurança.
            </q-banner>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn flat label="Cancelar" v-close-popup />

            <q-btn
              color="primary"
              unelevated
              type="submit"
              label="Criar acesso"
              :loading="savingAcessoAluno"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'

const $q = useQuasar()

const loading = ref(false)
const saving = ref(false)
const clientes = ref([])

const pagination = {
  rowsPerPage: 10,
}

const filters = reactive({
  search: '',
  status: 'Todos',
})

const modal = reactive({
  open: false,
  isEdit: false,
})

const form = reactive({
  id: null,
  nome: '',
  email: '',
  telefone: '',
  cpf: '',
  data_nascimento: '',
  data_matricula: '',
  data_ultimo_pagamento: '',
  data_vencimento: '',
  status: 'Ativo',
})

const statusOptions = [
  { label: 'Todos', value: 'Todos' },
  { label: 'Ativo', value: 'Ativo' },
  { label: 'Pendente', value: 'Pendente' },
  { label: 'Inativo', value: 'Inativo' },
]

const statusOptionsWithoutAll = [
  { label: 'Ativo', value: 'Ativo' },
  { label: 'Pendente', value: 'Pendente' },
  { label: 'Inativo', value: 'Inativo' },
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
    name: 'cpf',
    label: 'CPF',
    field: 'cpf',
    align: 'left',
  },
  {
    name: 'data_matricula',
    label: 'Matrícula',
    field: 'data_matricula',
    align: 'left',
    sortable: true,
  },
  {
    name: 'data_ultimo_pagamento',
    label: 'Último Pagamento',
    field: 'data_ultimo_pagamento',
    align: 'left',
    sortable: true,
  },
  {
    name: 'data_vencimento',
    label: 'Vencimento',
    field: 'data_vencimento',
    align: 'left',
    sortable: true,
  },
  {
    name: 'status',
    label: 'Status',
    field: 'status',
    align: 'center',
    sortable: true,
  },
  {
    name: 'created_at',
    label: 'Cadastro',
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

onMounted(() => {
  loadClientes()
})

async function loadClientes() {
  try {
    loading.value = true

    let query = supabase.from('clientes').select('*').order('created_at', { ascending: false })

    if (filters.status && filters.status !== 'Todos') {
      query = query.eq('status', filters.status)
    }

    if (filters.search?.trim()) {
      const search = filters.search.trim()

      query = query.or(
        `nome.ilike.%${search}%,email.ilike.%${search}%,telefone.ilike.%${search}%,cpf.ilike.%${search}%`,
      )
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    clientes.value = data || []
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Erro ao carregar clientes',
    })
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  resetForm()
  modal.isEdit = false
  modal.open = true
}

function calcularVencimentoPorPagamento() {
  if (!form.data_ultimo_pagamento) {
    calcularStatusAutomatico()
    return
  }

  const dataPagamento = new Date(`${form.data_ultimo_pagamento}T00:00:00`)
  dataPagamento.setMonth(dataPagamento.getMonth() + 1)

  form.data_vencimento = toDateInputValue(dataPagamento)

  calcularStatusAutomatico()
}

function calcularStatusAutomatico() {
  if (form.status === 'Inativo') {
    return
  }

  if (!form.data_vencimento) {
    form.status = 'Pendente'
    return
  }

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const vencimento = new Date(`${form.data_vencimento}T00:00:00`)
  vencimento.setHours(0, 0, 0, 0)

  form.status = vencimento < hoje ? 'Pendente' : 'Ativo'
}

function toDateInputValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getTodayDateInput() {
  return toDateInputValue(new Date())
}

function formatDateOnly(value) {
  if (!value) {
    return '-'
  }

  const [year, month, day] = value.split('-')

  if (!year || !month || !day) {
    return '-'
  }

  return `${day}/${month}/${year}`
}

const savingAcessoAluno = ref(false)

const acessoAlunoModal = reactive({
  open: false,
  cliente: null,
})

const acessoAlunoForm = reactive({
  email: '',
})

function openAcessoAlunoModal(cliente) {
  acessoAlunoModal.open = true
  acessoAlunoModal.cliente = cliente

  acessoAlunoForm.email = cliente.email || ''
}

async function criarAcessoAluno() {
  try {
    savingAcessoAluno.value = true

    const cliente = acessoAlunoModal.cliente

    if (!cliente?.id) {
      throw new Error('Cliente não informado')
    }

    if (!acessoAlunoForm.email?.trim()) {
      throw new Error('Informe o e-mail')
    }

    const { data, error } = await supabase.functions.invoke('criar-acesso-aluno', {
      body: {
        cliente_id: cliente.id,
        email: acessoAlunoForm.email,
        nome: cliente.nome,
      },
    })

    if (error) {
      let functionMessage = error.message

      try {
        if (error.context) {
          const errorBody = await error.context.json()
          functionMessage = errorBody?.error || functionMessage
        }
      } catch {
        // mantém mensagem padrão
      }

      throw new Error(functionMessage)
    }

    if (data?.error) {
      throw new Error(data.error)
    }

    const senhaTemporaria = data.senha_temporaria
    const copyButtonId = `copy-temp-password-${Date.now()}`

    $q.dialog({
      title: 'Acesso criado',
      html: true,
      message: `
    <div>
      <p>Acesso do aluno criado com sucesso.</p>

      <div style="
        margin: 12px 0;
        padding: 12px;
        border-radius: 8px;
        background: #f5f5f5;
        border: 1px solid #ddd;
      ">
        <div style="
          font-size: 12px;
          color: #666;
          margin-bottom: 6px;
        ">
          Senha temporária
        </div>

        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        ">
          <code style="
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 1px;
            color: #111;
          ">${senhaTemporaria}</code>

          <button
            id="${copyButtonId}"
            type="button"
            style="
              border: none;
              border-radius: 6px;
              padding: 8px 12px;
              cursor: pointer;
              background: #1976d2;
              color: white;
              font-weight: 600;
            "
          >
            Copiar
          </button>
        </div>
      </div>

      <p>Anote ou envie essa senha ao aluno.</p>
    </div>
  `,
      ok: {
        label: 'Entendi',
        color: 'primary',
        unelevated: true,
      },
      persistent: true,
    })

    setTimeout(() => {
      const copyButton = document.getElementById(copyButtonId)

      if (!copyButton) {
        return
      }

      copyButton.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(senhaTemporaria)

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
      })
    }, 300)

    acessoAlunoModal.open = false
    acessoAlunoModal.cliente = null
    acessoAlunoForm.email = ''

    await loadClientes()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Erro ao criar acesso do aluno',
    })
  } finally {
    savingAcessoAluno.value = false
  }
}

function openEditModal(cliente) {
  form.id = cliente.id
  form.nome = cliente.nome || ''
  form.email = cliente.email || ''
  form.telefone = cliente.telefone || ''
  form.cpf = cliente.cpf || ''
  form.data_nascimento = cliente.data_nascimento || ''
  form.data_matricula = cliente.data_matricula || ''
  form.data_ultimo_pagamento = cliente.data_ultimo_pagamento || ''
  form.data_vencimento = cliente.data_vencimento || ''
  form.status = cliente.status || 'Ativo'

  calcularStatusAutomatico()

  modal.isEdit = true
  modal.open = true
}

function getStatusColor(status) {
  if (status === 'Ativo') {
    return 'positive'
  }

  if (status === 'Pendente') {
    return 'warning'
  }

  if (status === 'Inativo') {
    return 'grey'
  }

  return 'grey'
}

function resetForm() {
  const today = getTodayDateInput()

  form.id = null
  form.nome = ''
  form.email = ''
  form.telefone = ''
  form.cpf = ''
  form.data_nascimento = ''
  form.data_matricula = today
  form.data_ultimo_pagamento = ''
  form.data_vencimento = ''
  form.status = 'Ativo'
}

async function saveCliente() {
  try {
    saving.value = true

    calcularStatusAutomatico()

    const payload = {
      nome: form.nome,
      email: emptyToNull(form.email),
      telefone: emptyToNull(form.telefone),
      cpf: emptyToNull(form.cpf),
      data_nascimento: emptyToNull(form.data_nascimento),
      data_matricula: emptyToNull(form.data_matricula),
      data_ultimo_pagamento: emptyToNull(form.data_ultimo_pagamento),
      data_vencimento: emptyToNull(form.data_vencimento),
      status: form.status,
    }

    if (modal.isEdit) {
      const { error } = await supabase.from('clientes').update(payload).eq('id', form.id)

      if (error) {
        throw error
      }

      $q.notify({
        type: 'positive',
        message: 'Cliente atualizado com sucesso',
      })
    } else {
      const { error } = await supabase.from('clientes').insert(payload)

      if (error) {
        throw error
      }

      $q.notify({
        type: 'positive',
        message: 'Cliente cadastrado com sucesso',
      })
    }

    modal.open = false
    resetForm()
    await loadClientes()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Erro ao salvar cliente',
    })
  } finally {
    saving.value = false
  }
}

function confirmDelete(cliente) {
  $q.dialog({
    title: 'Excluir cliente',
    message: `Deseja realmente excluir o cliente "${cliente.nome}"?`,
    persistent: true,
    ok: {
      label: 'Excluir',
      color: 'negative',
      unelevated: true,
    },
    cancel: {
      label: 'Cancelar',
      flat: true,
    },
  }).onOk(async () => {
    await deleteCliente(cliente)
  })
}

async function deleteCliente(cliente) {
  try {
    loading.value = true

    const { error } = await supabase.from('clientes').delete().eq('id', cliente.id)

    if (error) {
      throw error
    }

    $q.notify({
      type: 'positive',
      message: 'Cliente excluído com sucesso',
    })

    await loadClientes()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Erro ao excluir cliente',
    })
  } finally {
    loading.value = false
  }
}

function emptyToNull(value) {
  if (value === undefined || value === null) {
    return null
  }

  const valueString = String(value).trim()

  return valueString === '' ? null : valueString
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleDateString('pt-BR')
}
</script>
