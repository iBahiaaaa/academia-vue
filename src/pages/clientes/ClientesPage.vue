<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">Clientes</div>
        <div class="text-grey-7">Gerencie os alunos/clientes da academia</div>
      </div>

      <q-btn
        color="primary"
        icon="add"
        label="Novo Cliente"
        unelevated
        @click="openCreateModal"
      />
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
            <q-btn
              flat
              icon="refresh"
              label="Atualizar"
              :loading="loading"
              @click="loadClientes"
            />
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
        <template #body-cell-status="props">
          <q-td :props="props">
            <q-badge
              :color="props.row.status === 'Ativo' ? 'positive' : 'grey'"
              :label="props.row.status"
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
              @click="openEditModal(props.row)"
            >
              <q-tooltip>Editar</q-tooltip>
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
      <q-card style="width: 700px; max-width: 95vw;">
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
                <q-input
                  v-model="form.cpf"
                  outlined
                  dense
                  label="CPF"
                  :disable="saving"
                />
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
              label="Salvar"
              :loading="saving"
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
  rowsPerPage: 10
}

const filters = reactive({
  search: '',
  status: 'Todos'
})

const modal = reactive({
  open: false,
  isEdit: false
})

const form = reactive({
  id: null,
  nome: '',
  email: '',
  telefone: '',
  cpf: '',
  data_nascimento: '',
  status: 'Ativo'
})

const statusOptions = [
  { label: 'Todos', value: 'Todos' },
  { label: 'Ativo', value: 'Ativo' },
  { label: 'Inativo', value: 'Inativo' }
]

const statusOptionsWithoutAll = [
  { label: 'Ativo', value: 'Ativo' },
  { label: 'Inativo', value: 'Inativo' }
]

const columns = [
  {
    name: 'nome',
    label: 'Nome',
    field: 'nome',
    align: 'left',
    sortable: true
  },
  {
    name: 'email',
    label: 'E-mail',
    field: 'email',
    align: 'left'
  },
  {
    name: 'telefone',
    label: 'Telefone',
    field: 'telefone',
    align: 'left'
  },
  {
    name: 'cpf',
    label: 'CPF',
    field: 'cpf',
    align: 'left'
  },
  {
    name: 'status',
    label: 'Status',
    field: 'status',
    align: 'center',
    sortable: true
  },
  {
    name: 'created_at',
    label: 'Cadastro',
    field: 'created_at',
    align: 'left',
    sortable: true
  },
  {
    name: 'actions',
    label: 'Ações',
    field: 'actions',
    align: 'right'
  }
]

onMounted(() => {
  loadClientes()
})

async function loadClientes() {
  try {
    loading.value = true

    let query = supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters.status && filters.status !== 'Todos') {
      query = query.eq('status', filters.status)
    }

    if (filters.search?.trim()) {
      const search = filters.search.trim()

      query = query.or(
        `nome.ilike.%${search}%,email.ilike.%${search}%,telefone.ilike.%${search}%,cpf.ilike.%${search}%`
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
      message: error.message || 'Erro ao carregar clientes'
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

function openEditModal(cliente) {
  form.id = cliente.id
  form.nome = cliente.nome || ''
  form.email = cliente.email || ''
  form.telefone = cliente.telefone || ''
  form.cpf = cliente.cpf || ''
  form.data_nascimento = cliente.data_nascimento || ''
  form.status = cliente.status || 'Ativo'

  modal.isEdit = true
  modal.open = true
}

function resetForm() {
  form.id = null
  form.nome = ''
  form.email = ''
  form.telefone = ''
  form.cpf = ''
  form.data_nascimento = ''
  form.status = 'Ativo'
}

async function saveCliente() {
  try {
    saving.value = true

    const payload = {
      nome: form.nome,
      email: emptyToNull(form.email),
      telefone: emptyToNull(form.telefone),
      cpf: emptyToNull(form.cpf),
      data_nascimento: emptyToNull(form.data_nascimento),
      status: form.status
    }

    if (modal.isEdit) {
      const { error } = await supabase
        .from('clientes')
        .update(payload)
        .eq('id', form.id)

      if (error) {
        throw error
      }

      $q.notify({
        type: 'positive',
        message: 'Cliente atualizado com sucesso'
      })
    } else {
      const { error } = await supabase
        .from('clientes')
        .insert(payload)

      if (error) {
        throw error
      }

      $q.notify({
        type: 'positive',
        message: 'Cliente cadastrado com sucesso'
      })
    }

    modal.open = false
    resetForm()
    await loadClientes()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Erro ao salvar cliente'
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
      unelevated: true
    },
    cancel: {
      label: 'Cancelar',
      flat: true
    }
  }).onOk(async () => {
    await deleteCliente(cliente)
  })
}

async function deleteCliente(cliente) {
  try {
    loading.value = true

    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', cliente.id)

    if (error) {
      throw error
    }

    $q.notify({
      type: 'positive',
      message: 'Cliente excluído com sucesso'
    })

    await loadClientes()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Erro ao excluir cliente'
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
