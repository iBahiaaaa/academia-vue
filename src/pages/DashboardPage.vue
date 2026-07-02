<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">Dashboard</div>
        <div class="text-grey-7">Visão geral da academia, clientes e pagamentos</div>
      </div>

      <q-btn flat icon="refresh" label="Atualizar" :loading="loading" @click="loadDashboard" />
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center justify-between">
              <div>
                <div class="text-grey-7">Total de clientes</div>
                <div class="text-h4 text-weight-bold">{{ resumo.totalClientes }}</div>
              </div>
              <q-icon name="groups" size="42px" color="primary" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center justify-between">
              <div>
                <div class="text-grey-7">Ativos</div>
                <div class="text-h4 text-weight-bold text-positive">{{ resumo.ativos }}</div>
              </div>
              <q-icon name="check_circle" size="42px" color="positive" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center justify-between">
              <div>
                <div class="text-grey-7">Pendentes</div>
                <div class="text-h4 text-weight-bold text-warning">{{ resumo.pendentes }}</div>
              </div>
              <q-icon name="warning" size="42px" color="warning" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center justify-between">
              <div>
                <div class="text-grey-7">Inativos</div>
                <div class="text-h4 text-weight-bold text-grey">{{ resumo.inativos }}</div>
              </div>
              <q-icon name="block" size="42px" color="grey" />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center justify-between no-wrap">
              <div>
                <div class="row items-center q-gutter-xs">
                  <div class="text-grey-7">Receita do mês</div>

                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    :icon="ocultarValores ? 'visibility_off' : 'visibility'"
                    @click="ocultarValores = !ocultarValores"
                  >
                    <q-tooltip>
                      {{ ocultarValores ? 'Mostrar valores' : 'Ocultar valores' }}
                    </q-tooltip>
                  </q-btn>
                </div>

                <div class="text-h5 text-weight-bold text-positive">
                  {{ formatCurrencyHidden(resumo.receitaMes) }}
                </div>
              </div>

              <q-icon name="payments" size="42px" color="positive" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center justify-between">
              <div>
                <div class="text-grey-7">Pagamentos no mês</div>
                <div class="text-h4 text-weight-bold">{{ resumo.pagamentosMes }}</div>
              </div>
              <q-icon name="receipt_long" size="42px" color="primary" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center justify-between">
              <div>
                <div class="text-grey-7">Vencidos</div>
                <div class="text-h4 text-weight-bold text-negative">{{ resumo.vencidos }}</div>
              </div>
              <q-icon name="event_busy" size="42px" color="negative" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center justify-between">
              <div>
                <div class="text-grey-7">Vencem em 7 dias</div>
                <div class="text-h4 text-weight-bold text-warning">{{ resumo.vencendo7Dias }}</div>
              </div>
              <q-icon name="event" size="42px" color="warning" />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-lg-7">
        <q-card flat bordered>
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-h6">Clientes pendentes</div>
              <div class="text-grey-7">Alunos com pagamento vencido ou sem vencimento</div>
            </div>

            <q-btn flat dense color="primary" label="Ver pagamentos" to="/pagamentos" />
          </q-card-section>

          <q-separator />

          <q-table
            flat
            :rows="clientesPendentes"
            :columns="clientesColumns"
            row-key="id"
            :loading="loading"
            no-data-label="Nenhum cliente pendente"
            rows-per-page-label="Registros por página"
            :pagination="{ rowsPerPage: 5 }"
          >
            <template #body-cell-status="props">
              <q-td :props="props">
                <q-badge :color="getStatusColor(props.row.status)" :label="props.row.status" />
              </q-td>
            </template>

            <template #body-cell-data_vencimento="props">
              <q-td :props="props">
                <span :class="getVencimentoClass(props.row)">
                  {{ formatDateOnly(props.row.data_vencimento) }}
                </span>
              </q-td>
            </template>
          </q-table>
        </q-card>
      </div>

      <div class="col-12 col-lg-5">
        <q-card flat bordered>
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-h6">Últimos pagamentos</div>
              <div class="text-grey-7">Pagamentos registrados recentemente</div>
            </div>

            <q-btn flat dense color="primary" label="Ver todos" to="/pagamentos" />
          </q-card-section>

          <q-separator />

          <q-list separator>
            <q-item v-if="ultimosPagamentos.length === 0">
              <q-item-section>
                <q-item-label class="text-grey-7"> Nenhum pagamento registrado </q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-for="pagamento in ultimosPagamentos" :key="pagamento.id">
              <q-item-section avatar>
                <q-avatar color="positive" text-color="white" icon="payments" />
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ pagamento.clientes?.nome || 'Cliente não encontrado' }}
                </q-item-label>
                <q-item-label caption>
                  {{ formatDateOnly(pagamento.data_pagamento) }}
                  · {{ pagamento.forma_pagamento || 'Não informado' }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <div class="text-weight-bold">
                  {{ formatCurrency(pagamento.valor) }}
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { apiRequest } from 'src/services/api-client'

const $q = useQuasar()

const loading = ref(false)
const resumo = ref({
  totalClientes: 0,
  ativos: 0,
  pendentes: 0,
  inativos: 0,
  pagamentosMes: 0,
  receitaMes: 0,
  vencidos: 0,
  vencendo7Dias: 0,
})
const clientesPendentes = ref([])
const ultimosPagamentos = ref([])
const ocultarValores = ref(true)

const clientesColumns = [
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
]

onMounted(async () => {
  await loadDashboard()
})

async function loadDashboard() {
  try {
    loading.value = true

    const data = await apiRequest('/dashboard')

    resumo.value = {
      ...resumo.value,
      ...(data.resumo || {}),
    }
    clientesPendentes.value = data.clientesPendentes || []
    ultimosPagamentos.value = data.ultimosPagamentos || []
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Erro ao carregar dashboard',
    })
  } finally {
    loading.value = false
  }
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

function getTodayDateInput() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
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

function formatCurrencyHidden(value) {
  if (ocultarValores.value) {
    return 'R$ ••••••'
  }

  return formatCurrency(value)
}
</script>
