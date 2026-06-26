<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">Configurações</div>
        <div class="text-grey-7">
          Personalize a academia, aparência e regras padrões do sistema
        </div>
      </div>

      <q-btn
        color="primary"
        icon="save"
        label="Salvar"
        unelevated
        :loading="loading"
        @click="save"
      />
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-lg-8">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">Dados da academia</div>
            <div class="text-grey-7">
              Essas informações aparecem no topo do sistema e podem ser usadas em relatórios futuramente.
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-gutter-md">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.nome_academia"
                  outlined
                  dense
                  label="Nome da academia"
                  :disable="loading"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.slogan"
                  outlined
                  dense
                  label="Slogan"
                  :disable="loading"
                />
              </div>

              <div class="col-12 col-md-4">
                <q-input
                  v-model="form.whatsapp"
                  outlined
                  dense
                  label="WhatsApp"
                  :disable="loading"
                />
              </div>

              <div class="col-12 col-md-4">
                <q-input
                  v-model="form.email"
                  outlined
                  dense
                  label="E-mail"
                  type="email"
                  :disable="loading"
                />
              </div>

              <div class="col-12 col-md-4">
                <q-input
                  v-model.number="form.valor_mensalidade"
                  outlined
                  dense
                  label="Mensalidade padrão"
                  type="number"
                  step="0.01"
                  prefix="R$"
                  :disable="loading"
                />
              </div>

              <div class="col-12">
                <q-input
                  v-model="form.endereco"
                  outlined
                  dense
                  label="Endereço"
                  :disable="loading"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <div class="text-h6">Regras de pagamento</div>
            <div class="text-grey-7">
              Esses dados podem ser usados na tela de pagamentos para calcular vencimentos automaticamente.
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-4">
                <q-input
                  v-model.number="form.dias_vencimento_padrao"
                  outlined
                  dense
                  label="Dias para vencimento"
                  type="number"
                  suffix="dias"
                  :disable="loading"
                  :rules="[(val) => Number(val) > 0 || 'Informe um valor maior que zero']"
                />
              </div>

              <div class="col-12 col-md-8">
                <q-banner rounded class="bg-blue-1 text-blue-10">
                  Exemplo: se o pagamento for feito hoje e o padrão for
                  <strong>{{ form.dias_vencimento_padrao || 30 }} dias</strong>,
                  o sistema pode calcular automaticamente o próximo vencimento.
                </q-banner>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <div class="text-h6">Aparência</div>
            <div class="text-grey-7">
              Controle a identidade visual do sistema.
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-gutter-md">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-4">
                <q-input
                  v-model="form.cor_primaria"
                  outlined
                  dense
                  label="Cor primária"
                  :disable="loading"
                >
                  <template #append>
                    <q-icon name="palette" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-color v-model="form.cor_primaria" />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-4">
                <q-input
                  v-model="form.cor_secundaria"
                  outlined
                  dense
                  label="Cor secundária"
                  :disable="loading"
                >
                  <template #append>
                    <q-icon name="palette" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-color v-model="form.cor_secundaria" />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-4">
                <q-input
                  v-model="form.cor_acento"
                  outlined
                  dense
                  label="Cor de destaque"
                  :disable="loading"
                >
                  <template #append>
                    <q-icon name="palette" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-color v-model="form.cor_acento" />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-4">
                <q-select
                  v-model="form.tema"
                  outlined
                  dense
                  emit-value
                  map-options
                  label="Tema"
                  :options="temaOptions"
                  :disable="loading"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-lg-4">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">Pré-visualização</div>
            <div class="text-grey-7">
              Veja como a identidade aparece no sistema.
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <q-card flat bordered>
              <q-card-section :style="previewHeaderStyle" class="text-white">
                <div class="text-h5 text-weight-bold">
                  {{ form.nome_academia || 'Nome da academia' }}
                </div>
                <div>
                  {{ form.slogan || 'Slogan da academia' }}
                </div>
              </q-card-section>

              <q-card-section>
                <div class="row q-col-gutter-sm">
                  <div class="col-12">
                    <q-btn
                      color="primary"
                      label="Botão primário"
                      unelevated
                      class="full-width"
                    />
                  </div>

                  <div class="col-12">
                    <q-btn
                      color="secondary"
                      label="Botão secundário"
                      unelevated
                      class="full-width"
                    />
                  </div>

                  <div class="col-12">
                    <q-badge color="accent" label="Destaque" />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <div class="text-h6">Ideias para evoluir depois</div>
          </q-card-section>

          <q-separator />

          <q-list separator>
            <q-item>
              <q-item-section avatar>
                <q-icon name="image" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Logo da academia</q-item-label>
                <q-item-label caption>Upload para aparecer no menu e relatórios.</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar>
                <q-icon name="receipt_long" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Recibo de pagamento</q-item-label>
                <q-item-label caption>Gerar comprovante em PDF para o aluno.</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar>
                <q-icon name="notifications" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Alertas de vencimento</q-item-label>
                <q-item-label caption>Mostrar alunos vencendo nos próximos dias.</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar>
                <q-icon name="admin_panel_settings" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Perfis de acesso</q-item-label>
                <q-item-label caption>Admin, recepção, professor e financeiro.</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useQuasar } from 'quasar'
import { useConfigStore } from 'src/stores/config-store'

const $q = useQuasar()
const configStore = useConfigStore()

const form = reactive({
  nome_academia: '',
  slogan: '',
  cor_primaria: '#1976D2',
  cor_secundaria: '#26A69A',
  cor_acento: '#9C27B0',
  tema: 'light',
  valor_mensalidade: 0,
  dias_vencimento_padrao: 30,
  whatsapp: '',
  email: '',
  endereco: ''
})

const temaOptions = [
  { label: 'Claro', value: 'light' },
  { label: 'Escuro', value: 'dark' }
]

const loading = computed(() => configStore.loading)

const previewHeaderStyle = computed(() => ({
  background: `linear-gradient(135deg, ${form.cor_primaria}, ${form.cor_secundaria})`
}))

onMounted(async () => {
  await configStore.loadConfig()
  fillForm()
})

function fillForm() {
  Object.assign(form, {
    nome_academia: configStore.config.nome_academia || 'Bahia Gym',
    slogan: configStore.config.slogan || '',
    cor_primaria: configStore.config.cor_primaria || '#1976D2',
    cor_secundaria: configStore.config.cor_secundaria || '#26A69A',
    cor_acento: configStore.config.cor_acento || '#9C27B0',
    tema: configStore.config.tema || 'light',
    valor_mensalidade: Number(configStore.config.valor_mensalidade || 0),
    dias_vencimento_padrao: Number(configStore.config.dias_vencimento_padrao || 30),
    whatsapp: configStore.config.whatsapp || '',
    email: configStore.config.email || '',
    endereco: configStore.config.endereco || ''
  })
}

async function save() {
  try {
    if (!form.nome_academia?.trim()) {
      throw new Error('Informe o nome da academia')
    }

    if (!Number(form.dias_vencimento_padrao) || Number(form.dias_vencimento_padrao) <= 0) {
      throw new Error('Informe uma quantidade válida de dias para vencimento')
    }

    await configStore.saveConfig({
      nome_academia: form.nome_academia,
      slogan: form.slogan,
      cor_primaria: form.cor_primaria,
      cor_secundaria: form.cor_secundaria,
      cor_acento: form.cor_acento,
      tema: form.tema,
      valor_mensalidade: Number(form.valor_mensalidade || 0),
      dias_vencimento_padrao: Number(form.dias_vencimento_padrao || 30),
      whatsapp: emptyToNull(form.whatsapp),
      email: emptyToNull(form.email),
      endereco: emptyToNull(form.endereco)
    })

    $q.notify({
      type: 'positive',
      message: 'Configurações salvas com sucesso'
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Erro ao salvar configurações'
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
</script>
