<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">Pagamentos</div>
        <div class="text-grey-7">Controle de vencimentos, pendências e mensalidades</div>
      </div>

      <q-btn flat icon="refresh" label="Atualizar" :loading="loading" @click="loadClientes" />
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-grey-7">Clientes ativos</div>
            <div class="text-h4 text-weight-bold text-positive">
              {{ resumo.ativos }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-grey-7">Pendentes</div>
            <div class="text-h4 text-weight-bold text-warning">
              {{ resumo.pendentes }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-grey-7">Inativos</div>
            <div class="text-h4 text-weight-bold text-grey">
              {{ resumo.inativos }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-grey-7">Total clientes</div>
            <div class="text-h4 text-weight-bold">
              {{ clientes.length }}
            </div>
          </q-card-section>
        </q-card>
      </div>
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

          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.vencimento"
              outlined
              dense
              emit-value
              map-options
              label="Vencimento"
              :options="vencimentoOptions"
              @update:model-value="loadClientes"
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
            <q-badge :color="getStatusColor(props.row.status)" :label="props.row.status" />
          </q-td>
        </template>

        <template #body-cell-data_ultimo_pagamento="props">
          <q-td :props="props">
            {{ formatDateOnly(props.row.data_ultimo_pagamento) }}
          </q-td>
        </template>

        <template #body-cell-data_vencimento="props">
          <q-td :props="props">
            <span :class="getVencimentoClass(props.row)">
              {{ formatDateOnly(props.row.data_vencimento) }}
            </span>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props" class="text-right">
            <q-btn
              color="positive"
              icon="payments"
              label="Registrar"
              dense
              unelevated
              @click="openPagamentoModal(props.row)"
            />

            <q-btn
              flat
              round
              dense
              color="primary"
              icon="history"
              class="q-ml-sm"
              @click="openHistoricoModal(props.row)"
            >
              <q-tooltip>Histórico</q-tooltip>
            </q-btn>

            <q-btn
              flat
              round
              dense
              color="warning"
              icon="block"
              class="q-ml-sm"
              @click="confirmInativar(props.row)"
              v-if="props.row.status !== 'Inativo'"
            >
              <q-tooltip>Inativar</q-tooltip>
            </q-btn>

            <q-btn
              flat
              round
              dense
              color="positive"
              icon="check_circle"
              class="q-ml-sm"
              @click="confirmReativar(props.row)"
              v-if="props.row.status === 'Inativo'"
            >
              <q-tooltip>Reativar</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="pagamentoModal.open" persistent>
      <q-card style="width: 620px; max-width: 95vw">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6">Registrar pagamento</div>
            <div class="text-grey-7">{{ pagamentoModal.cliente?.nome }}</div>
          </div>

          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-form @submit.prevent="registrarPagamento">
          <q-card-section class="q-gutter-md">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="pagamentoForm.data_pagamento"
                  outlined
                  dense
                  label="Data do pagamento"
                  type="date"
                  :disable="saving"
                  lazy-rules
                  :rules="[(val) => !!val || 'Informe a data do pagamento']"
                  @update:model-value="calcularVencimento"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  v-model="pagamentoForm.data_vencimento"
                  outlined
                  dense
                  label="Novo vencimento"
                  type="date"
                  :disable="saving"
                  lazy-rules
                  :rules="[(val) => !!val || 'Informe a data de vencimento']"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  v-model.number="pagamentoForm.valor"
                  outlined
                  dense
                  label="Valor"
                  type="number"
                  step="0.01"
                  prefix="R$"
                  :disable="saving"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-select
                  v-model="pagamentoForm.forma_pagamento"
                  outlined
                  dense
                  label="Forma de pagamento"
                  emit-value
                  map-options
                  :disable="saving"
                  :options="formaPagamentoOptions"
                />
              </div>

              <div class="col-12">
                <q-input
                  v-model="pagamentoForm.observacao"
                  outlined
                  dense
                  label="Observação"
                  type="textarea"
                  rows="3"
                  :disable="saving"
                />
              </div>
            </div>

            <q-banner rounded class="bg-green-1 text-green-10">
              Ao salvar, o cliente ficará como <strong>Ativo</strong>, o último pagamento será
              atualizado e o novo vencimento será gravado.
            </q-banner>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn flat label="Cancelar" :disable="saving" v-close-popup />

            <q-btn
              color="positive"
              unelevated
              type="submit"
              label="Confirmar pagamento"
              :loading="saving"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="historicoModal.open">
      <q-card style="width: 760px; max-width: 95vw">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6">Histórico de pagamentos</div>
            <div class="text-grey-7">{{ historicoModal.cliente?.nome }}</div>
          </div>

          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-table
            flat
            :rows="historico"
            :columns="historicoColumns"
            row-key="id"
            :loading="loadingHistorico"
            no-data-label="Nenhum pagamento encontrado"
            rows-per-page-label="Registros por página"
          >
            <template #body-cell-data_pagamento="props">
              <q-td :props="props">
                {{ formatDateOnly(props.row.data_pagamento) }}
              </q-td>
            </template>

            <template #body-cell-data_vencimento="props">
              <q-td :props="props">
                {{ formatDateOnly(props.row.data_vencimento) }}
              </q-td>
            </template>

            <template #body-cell-valor="props">
              <q-td :props="props">
                {{ formatCurrency(props.row.valor) }}
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { apiRequest } from 'src/services/api-client'
import { useConfigStore } from 'src/stores/config-store'

const configStore = useConfigStore()

const $q = useQuasar()

const loading = ref(false)
const saving = ref(false)
const loadingHistorico = ref(false)

const clientes = ref([])
const historico = ref([])

const pagination = {
  rowsPerPage: 10,
}

const filters = reactive({
  search: '',
  status: 'Todos',
  vencimento: 'Todos',
})

const pagamentoModal = reactive({
  open: false,
  cliente: null,
})

const historicoModal = reactive({
  open: false,
  cliente: null,
})

const pagamentoForm = reactive({
  data_pagamento: '',
  data_vencimento: '',
  valor: null,
  forma_pagamento: 'Dinheiro',
  observacao: '',
})

const statusOptions = [
  { label: 'Todos', value: 'Todos' },
  { label: 'Ativo', value: 'Ativo' },
  { label: 'Pendente', value: 'Pendente' },
  { label: 'Inativo', value: 'Inativo' },
]

const vencimentoOptions = [
  { label: 'Todos', value: 'Todos' },
  { label: 'Vencidos', value: 'Vencidos' },
  { label: 'Vence hoje', value: 'Hoje' },
  { label: 'Próximos 7 dias', value: 'Proximos7Dias' },
]

const formaPagamentoOptions = [
  { label: 'Dinheiro', value: 'Dinheiro' },
  { label: 'Pix', value: 'Pix' },
  { label: 'Cartão de crédito', value: 'Cartão de crédito' },
  { label: 'Cartão de débito', value: 'Cartão de débito' },
  { label: 'Boleto', value: 'Boleto' },
]

const columns = [
  {
    name: 'nome',
    label: 'Cliente',
    field: 'nome',
    align: 'left',
    sortable: true,
  },
  {
    name: 'telefone',
    label: 'Telefone',
    field: 'telefone',
    align: 'left',
  },
  {
    name: 'data_ultimo_pagamento',
    label: 'Último pagamento',
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
    name: 'actions',
    label: 'Ações',
    field: 'actions',
    align: 'right',
  },
]

const historicoColumns = [
  {
    name: 'data_pagamento',
    label: 'Pagamento',
    field: 'data_pagamento',
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
    name: 'valor',
    label: 'Valor',
    field: 'valor',
    align: 'left',
  },
  {
    name: 'forma_pagamento',
    label: 'Forma',
    field: 'forma_pagamento',
    align: 'left',
  },
  {
    name: 'observacao',
    label: 'Observação',
    field: 'observacao',
    align: 'left',
  },
]

const resumo = computed(() => {
  return {
    ativos: clientes.value.filter((cliente) => cliente.status === 'Ativo').length,
    pendentes: clientes.value.filter((cliente) => cliente.status === 'Pendente').length,
    inativos: clientes.value.filter((cliente) => cliente.status === 'Inativo').length,
  }
})

onMounted(async () => {
  if (!configStore.initialized) {
    await configStore.loadConfig()
  }

  await loadClientes()
})

async function loadClientes() {
  try {
    loading.value = true

    const params = new URLSearchParams()

    if (filters.status && filters.status !== 'Todos') {
      params.set('status', filters.status)
    }

    if (filters.search?.trim()) {
      params.set('search', filters.search.trim())
    }

    const query = params.toString()
    const data = await apiRequest(`/clientes${query ? `?${query}` : ''}`)

    clientes.value = filtrarClientesPorVencimento(data || []).sort(compareVencimento)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Erro ao carregar pagamentos',
    })
  } finally {
    loading.value = false
  }
}

function openPagamentoModal(cliente) {
  pagamentoModal.cliente = cliente
  pagamentoModal.open = true

  pagamentoForm.data_pagamento = getTodayDateInput()
  pagamentoForm.valor = Number(configStore.config.valor_mensalidade || 0)
  pagamentoForm.forma_pagamento = 'Dinheiro'
  pagamentoForm.observacao = ''

  calcularVencimento()
}

function calcularVencimento() {
  if (!pagamentoForm.data_pagamento) {
    pagamentoForm.data_vencimento = ''
    return
  }

  const dias = Number(configStore.config.dias_vencimento_padrao || 30)

  const dataPagamento = new Date(`${pagamentoForm.data_pagamento}T00:00:00`)
  dataPagamento.setDate(dataPagamento.getDate() + dias)

  pagamentoForm.data_vencimento = toDateInputValue(dataPagamento)
}

async function registrarPagamento() {
  try {
    saving.value = true

    const cliente = pagamentoModal.cliente

    if (!cliente?.id) {
      throw new Error('Cliente não informado')
    }

    if (!pagamentoForm.data_pagamento) {
      throw new Error('Informe a data do pagamento')
    }

    if (!pagamentoForm.data_vencimento) {
      throw new Error('Informe a data de vencimento')
    }

    const pagamentoPayload = {
      cliente_id: cliente.id,
      data_pagamento: pagamentoForm.data_pagamento,
      data_vencimento: pagamentoForm.data_vencimento,
      valor: pagamentoForm.valor || null,
      forma_pagamento: pagamentoForm.forma_pagamento || null,
      observacao: emptyToNull(pagamentoForm.observacao),
    }

    await apiRequest('/pagamentos', {
      method: 'POST',
      body: pagamentoPayload,
    })

    await atualizarCliente(cliente, {
      data_ultimo_pagamento: pagamentoForm.data_pagamento,
      data_vencimento: pagamentoForm.data_vencimento,
      status: 'Ativo',
    })

    $q.notify({
      type: 'positive',
      message: 'Pagamento registrado com sucesso',
    })

    pagamentoModal.open = false
    pagamentoModal.cliente = null

    await loadClientes()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Erro ao registrar pagamento',
    })
  } finally {
    saving.value = false
  }
}

async function openHistoricoModal(cliente) {
  historicoModal.cliente = cliente
  historicoModal.open = true

  await loadHistorico(cliente.id)
}

async function loadHistorico(clienteId) {
  try {
    loadingHistorico.value = true

    const data = await apiRequest(`/pagamentos/clientes/${clienteId}/historico`)

    historico.value = data || []
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Erro ao carregar histórico',
    })
  } finally {
    loadingHistorico.value = false
  }
}

function confirmInativar(cliente) {
  $q.dialog({
    title: 'Inativar cliente',
    message: `Deseja inativar o cliente "${cliente.nome}"?`,
    persistent: true,
    ok: {
      label: 'Inativar',
      color: 'warning',
      unelevated: true,
    },
    cancel: {
      label: 'Cancelar',
      flat: true,
    },
  }).onOk(async () => {
    await alterarStatusCliente(cliente, 'Inativo')
  })
}

function confirmReativar(cliente) {
  $q.dialog({
    title: 'Reativar cliente',
    message: `Deseja reativar o cliente "${cliente.nome}"?`,
    persistent: true,
    ok: {
      label: 'Reativar',
      color: 'positive',
      unelevated: true,
    },
    cancel: {
      label: 'Cancelar',
      flat: true,
    },
  }).onOk(async () => {
    const novoStatus = calcularStatusPorVencimento(cliente.data_vencimento)

    await alterarStatusCliente(cliente, novoStatus)
  })
}

async function alterarStatusCliente(cliente, status) {
  try {
    loading.value = true

    await atualizarCliente(cliente, { status })

    $q.notify({
      type: 'positive',
      message: 'Status atualizado com sucesso',
    })

    await loadClientes()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Erro ao atualizar status',
    })
  } finally {
    loading.value = false
  }
}

async function atualizarCliente(cliente, changes) {
  const payload = {
    nome: cliente.nome,
    email: emptyToNull(cliente.email),
    telefone: emptyToNull(cliente.telefone),
    cpf: emptyToNull(cliente.cpf),
    data_nascimento: emptyToNull(cliente.data_nascimento),
    data_matricula: emptyToNull(cliente.data_matricula),
    data_ultimo_pagamento: emptyToNull(cliente.data_ultimo_pagamento),
    data_vencimento: emptyToNull(cliente.data_vencimento),
    status: cliente.status || 'Ativo',
    ...changes,
  }

  return apiRequest(`/clientes/${cliente.id}`, {
    method: 'PATCH',
    body: payload,
  })
}

function filtrarClientesPorVencimento(lista) {
  if (!filters.vencimento || filters.vencimento === 'Todos') {
    return lista
  }

  const hoje = getTodayDateInput()

  if (filters.vencimento === 'Vencidos') {
    return lista.filter((cliente) => {
      return cliente.status !== 'Inativo' && cliente.data_vencimento && cliente.data_vencimento < hoje
    })
  }

  if (filters.vencimento === 'Hoje') {
    return lista.filter((cliente) => cliente.data_vencimento === hoje)
  }

  if (filters.vencimento === 'Proximos7Dias') {
    const limite = new Date()
    limite.setDate(limite.getDate() + 7)
    const limiteValue = toDateInputValue(limite)

    return lista.filter((cliente) => {
      return cliente.data_vencimento >= hoje && cliente.data_vencimento <= limiteValue
    })
  }

  return lista
}

function compareVencimento(a, b) {
  if (!a.data_vencimento && !b.data_vencimento) {
    return 0
  }

  if (!a.data_vencimento) {
    return 1
  }

  if (!b.data_vencimento) {
    return -1
  }

  return a.data_vencimento.localeCompare(b.data_vencimento)
}

function calcularStatusPorVencimento(dataVencimento) {
  if (!dataVencimento) {
    return 'Pendente'
  }

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const vencimento = new Date(`${dataVencimento}T00:00:00`)
  vencimento.setHours(0, 0, 0, 0)

  return vencimento < hoje ? 'Pendente' : 'Ativo'
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

function getVencimentoClass(cliente) {
  if (cliente.status === 'Inativo') {
    return 'text-grey'
  }

  if (!cliente.data_vencimento) {
    return 'text-warning text-weight-bold'
  }

  const hoje = getTodayDateInput()

  if (cliente.data_vencimento < hoje) {
    return 'text-negative text-weight-bold'
  }

  if (cliente.data_vencimento === hoje) {
    return 'text-warning text-weight-bold'
  }

  return ''
}

function emptyToNull(value) {
  if (value === undefined || value === null) {
    return null
  }

  const valueString = String(value).trim()

  return valueString === '' ? null : valueString
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

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}
</script>
