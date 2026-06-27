<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">Treinos</div>
        <div class="text-grey-7">Gerencie as fichas de treino dos alunos</div>
      </div>

      <div class="row q-gutter-sm">
        <q-btn flat icon="refresh" label="Atualizar" :loading="loading" @click="loadPage" />

        <q-btn
          color="primary"
          icon="settings"
          label="Configurações"
          unelevated
          @click="openExerciciosModal"
        />
      </div>
    </div>

    <q-card flat bordered>
      <q-card-section>
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-md-7">
            <q-input
              v-model="filters.search"
              outlined
              dense
              debounce="400"
              placeholder="Buscar aluno por nome, e-mail, telefone ou CPF"
              clearable
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.statusTreino"
              outlined
              dense
              emit-value
              map-options
              label="Situação do treino"
              :options="statusTreinoOptions"
            />
          </div>

          <div class="col-12 col-md-2 text-right">
            <q-badge color="primary" class="q-pa-sm">
              {{ clientesFiltrados.length }} aluno(s)
            </q-badge>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-table
        flat
        :rows="clientesFiltrados"
        :columns="clienteColumns"
        row-key="id"
        :loading="loading"
        no-data-label="Nenhum aluno encontrado"
        rows-per-page-label="Registros por página"
        :pagination="{ rowsPerPage: 10 }"
      >
        <template #body-cell-status="props">
          <q-td :props="props">
            <q-badge
              :color="
                props.row.status === 'Ativo'
                  ? 'positive'
                  : props.row.status === 'Pendente'
                    ? 'warning'
                    : 'grey'
              "
              :label="props.row.status || 'Sem status'"
            />
          </q-td>
        </template>

        <template #body-cell-treino="props">
          <q-td :props="props">
            <div v-if="getTreinoAtivo(props.row.id)">
              <div class="text-weight-medium">
                {{ getTreinoAtivo(props.row.id).nome }}
              </div>
              <div class="text-caption text-grey-7">
                {{ getTreinoAtivo(props.row.id).objetivo || 'Sem objetivo' }}
                · {{ getTreinoAtivo(props.row.id).origem }}
              </div>
            </div>

            <q-badge v-else color="grey" label="Sem treino" />
          </q-td>
        </template>

        <template #body-cell-revisao="props">
          <q-td :props="props">
            <q-badge
              v-if="getTreinoAtivo(props.row.id)"
              :color="
                getTreinoAtivo(props.row.id).revisao_status === 'Pendente' ? 'warning' : 'positive'
              "
              :label="getTreinoAtivo(props.row.id).revisao_status"
            />

            <span v-else>-</span>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props" class="text-right">
            <q-btn
              v-if="!getTreinoAtivo(props.row.id)"
              color="positive"
              icon="add"
              label="Criar"
              dense
              unelevated
              @click="openCreateTreinoModal(props.row)"
            />

            <q-btn
              v-else
              color="primary"
              icon="edit"
              label="Editar"
              dense
              unelevated
              @click="openEditTreinoModal(props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- MODAL CRIAR/EDITAR TREINO -->
    <q-dialog v-model="treinoModal.open" persistent>
      <q-card style="width: 760px; max-width: 95vw">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6">
              {{ treinoModal.isEdit ? 'Editar ficha de treino' : 'Criar ficha de treino' }}
            </div>
            <div class="text-grey-7">
              {{ treinoModal.cliente?.nome }}
            </div>
          </div>

          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-form @submit.prevent="saveTreino">
          <q-card-section class="q-gutter-md">
            <q-banner
              v-if="treinoForm.origem === 'IA' && treinoForm.revisao_status === 'Pendente'"
              rounded
              class="bg-yellow-1 text-yellow-10"
            >
              Esta ficha foi gerada automaticamente e ainda está pendente de revisão do instrutor.
            </q-banner>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="treinoForm.nome"
                  outlined
                  dense
                  label="Nome da ficha"
                  :disable="saving"
                  lazy-rules
                  :rules="[(val) => !!val || 'Informe o nome da ficha']"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-select
                  v-model="treinoForm.objetivo"
                  outlined
                  dense
                  emit-value
                  map-options
                  label="Objetivo"
                  :disable="saving"
                  :options="objetivoOptions"
                />
              </div>

              <div class="col-12 col-md-4">
                <q-select
                  v-model="treinoForm.nivel"
                  outlined
                  dense
                  emit-value
                  map-options
                  label="Nível"
                  :disable="saving"
                  :options="nivelOptions"
                />
              </div>

              <div class="col-12 col-md-4">
                <q-input
                  v-model.number="treinoForm.frequencia_semanal"
                  outlined
                  dense
                  type="number"
                  label="Frequência semanal"
                  suffix="x"
                  :disable="saving"
                />
              </div>

              <div class="col-12 col-md-4">
                <q-input
                  v-model.number="treinoForm.tempo_por_treino"
                  outlined
                  dense
                  type="number"
                  label="Tempo por treino"
                  suffix="min"
                  :disable="saving"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-select
                  v-model="treinoForm.revisao_status"
                  outlined
                  dense
                  emit-value
                  map-options
                  label="Status da revisão"
                  :disable="saving"
                  :options="revisaoOptions"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-select
                  v-model="treinoForm.status"
                  outlined
                  dense
                  emit-value
                  map-options
                  label="Status da ficha"
                  :disable="saving"
                  :options="statusFichaOptions"
                />
              </div>

              <div class="col-12">
                <q-input
                  v-model="treinoForm.observacao"
                  outlined
                  dense
                  type="textarea"
                  rows="3"
                  label="Observações"
                  :disable="saving"
                />
              </div>
            </div>

            <q-separator />

            <div class="row items-center justify-between">
              <div>
                <div class="text-subtitle1 text-weight-bold">Dias do treino</div>
                <div class="text-caption text-grey-7">
                  Esta primeira versão cria a ficha. Depois vamos evoluir para editar exercícios
                  dentro dela.
                </div>
              </div>

              <q-btn flat color="primary" icon="add" label="Adicionar dia" @click="addDia" />
            </div>

            <q-list bordered separator>
              <q-item v-for="(dia, index) in diasForm" :key="dia.local_id">
                <q-item-section>
                  <div class="row q-col-gutter-sm">
                    <div class="col-12 col-md-5">
                      <q-input
                        v-model="dia.nome"
                        outlined
                        dense
                        label="Nome do dia"
                        placeholder="Ex: Treino A"
                      />
                    </div>

                    <div class="col-12 col-md-5">
                      <q-input
                        v-model="dia.grupo_foco"
                        outlined
                        dense
                        label="Grupo foco"
                        placeholder="Ex: Peito e tríceps"
                      />
                    </div>

                    <div class="col-12 col-md-2">
                      <q-input
                        v-model.number="dia.ordem"
                        outlined
                        dense
                        type="number"
                        label="Ordem"
                      />
                    </div>
                  </div>
                </q-item-section>

                <q-item-section side>
                  <q-btn
                    flat
                    round
                    dense
                    color="negative"
                    icon="delete"
                    @click="removeDia(index)"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn flat label="Cancelar" :disable="saving" v-close-popup />

            <q-btn
              color="primary"
              unelevated
              type="submit"
              label="Salvar ficha"
              :loading="saving"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- MODAL CONFIGURAÇÕES DE EXERCÍCIOS -->
    <q-dialog v-model="exerciciosModal.open" persistent>
      <q-card style="width: 980px; max-width: 98vw">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6">Configurações de exercícios</div>
            <div class="text-grey-7">
              Cadastre os exercícios, aparelhos e imagem futura para o app do aluno
            </div>
          </div>

          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">
                    {{ exercicioForm.id ? 'Editar exercício' : 'Novo exercício' }}
                  </div>
                </q-card-section>

                <q-separator />

                <q-form @submit.prevent="saveExercicio">
                  <q-card-section class="q-gutter-md">
                    <q-input
                      v-model="exercicioForm.nome"
                      outlined
                      dense
                      label="Nome do exercício"
                      :disable="savingExercicio"
                      lazy-rules
                      :rules="[(val) => !!val || 'Informe o nome']"
                    />

                    <q-input
                      v-model="exercicioForm.aparelho"
                      outlined
                      dense
                      label="Aparelho"
                      placeholder="Ex: Máquina, halteres, barra, polia"
                      :disable="savingExercicio"
                    />

                    <q-select
                      v-model="exercicioForm.grupo_muscular"
                      outlined
                      dense
                      emit-value
                      map-options
                      label="Grupo muscular"
                      :disable="savingExercicio"
                      :options="grupoMuscularOptions"
                    />

                    <q-select
                      v-model="exercicioForm.nivel"
                      outlined
                      dense
                      emit-value
                      map-options
                      label="Nível"
                      :disable="savingExercicio"
                      :options="nivelExercicioOptions"
                    />

                    <q-card flat bordered>
                      <q-card-section>
                        <div class="row items-center justify-between">
                          <div>
                            <div class="text-subtitle2">Imagem exemplo</div>
                            <div class="text-caption text-grey-7">
                              Imagem que futuramente será exibida no celular do aluno
                            </div>
                          </div>

                          <q-btn
                            color="primary"
                            outline
                            dense
                            icon="image"
                            label="Configurar"
                            @click="openImagemModal"
                          />
                        </div>

                        <div v-if="exercicioForm.imagem_url" class="q-mt-md">
                          <q-img
                            :src="exercicioForm.imagem_url"
                            ratio="16/9"
                            spinner-color="primary"
                            class="rounded-borders"
                          >
                            <template #error>
                              <div class="absolute-full flex flex-center bg-grey-3 text-grey-8">
                                Erro ao carregar imagem
                              </div>
                            </template>
                          </q-img>

                          <div class="text-caption text-grey-7 q-mt-xs ellipsis">
                            {{ exercicioForm.imagem_url }}
                          </div>
                        </div>

                        <div v-else class="q-mt-md text-grey-7">Nenhuma imagem configurada</div>
                      </q-card-section>
                    </q-card>

                    <q-toggle
                      v-model="exercicioForm.ativo"
                      label="Exercício ativo"
                      color="positive"
                      :disable="savingExercicio"
                    />
                  </q-card-section>

                  <q-separator />

                  <q-card-actions align="right">
                    <q-btn
                      flat
                      label="Limpar"
                      :disable="savingExercicio"
                      @click="resetExercicioForm"
                    />

                    <q-btn
                      color="primary"
                      unelevated
                      type="submit"
                      label="Salvar"
                      :loading="savingExercicio"
                    />
                  </q-card-actions>
                </q-form>
              </q-card>
            </div>

            <div class="col-12 col-md-8">
              <q-card flat bordered>
                <q-card-section>
                  <q-input
                    v-model="filters.exercicioSearch"
                    outlined
                    dense
                    clearable
                    debounce="300"
                    placeholder="Buscar exercício"
                  >
                    <template #prepend>
                      <q-icon name="search" />
                    </template>
                  </q-input>
                </q-card-section>

                <q-separator />

                <q-table
                  flat
                  :rows="exerciciosFiltrados"
                  :columns="exercicioColumns"
                  row-key="id"
                  :loading="loadingExercicios"
                  no-data-label="Nenhum exercício cadastrado"
                  rows-per-page-label="Registros por página"
                  :pagination="{ rowsPerPage: 8 }"
                >
                  <template #body-cell-ativo="props">
                    <q-td :props="props">
                      <q-badge
                        :color="props.row.ativo ? 'positive' : 'grey'"
                        :label="props.row.ativo ? 'Ativo' : 'Inativo'"
                      />
                    </q-td>
                  </template>

                  <template #body-cell-imagem_url="props">
                    <q-td :props="props">
                      <q-badge v-if="props.row.imagem_url" color="primary" label="Configurada" />
                      <span v-else>-</span>
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
                        @click="editExercicio(props.row)"
                      />

                      <q-btn
                        flat
                        round
                        dense
                        color="negative"
                        icon="delete"
                        @click="confirmDeleteExercicio(props.row)"
                      />
                    </q-td>
                  </template>
                </q-table>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
    <!-- MODAL IMAGEM DO EXERCÍCIO -->
    <q-dialog v-model="imagemModal.open" persistent>
      <q-card style="width: 620px; max-width: 95vw">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6">Imagem do exercício</div>
            <div class="text-grey-7">Configure a URL da imagem exemplo</div>
          </div>

          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md">
          <q-input
            v-model="imagemForm.url"
            outlined
            dense
            label="URL da imagem"
            placeholder="https://exemplo.com/imagem.png"
            clearable
          />

          <q-card flat bordered>
            <q-card-section>
              <div class="text-subtitle2 q-mb-sm">Prévia</div>

              <div v-if="imagemForm.url" class="image-preview-box">
                <img
                  :src="imagemForm.url"
                  alt="Prévia do exercício"
                  class="image-preview"
                  @error="imagemErro = true"
                  @load="imagemErro = false"
                />

                <div v-if="imagemErro" class="image-error">
                  Não foi possível carregar essa imagem. Verifique se a URL é pública e direta.
                </div>
              </div>

              <div
                v-else
                class="flex flex-center bg-grey-2 text-grey-7 rounded-borders"
                style="height: 220px"
              >
                Informe uma URL para visualizar a imagem
              </div>
            </q-card-section>
          </q-card>
        </q-card-section>

        <q-separator />

        <q-card-actions align="between">
          <q-btn flat color="negative" label="Remover imagem" @click="removeImagem" />

          <div>
            <q-btn flat label="Cancelar" v-close-popup />

            <q-btn color="primary" unelevated label="Aplicar" @click="applyImagem" />
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'

const $q = useQuasar()

const loading = ref(false)
const saving = ref(false)
const loadingExercicios = ref(false)
const savingExercicio = ref(false)

const clientes = ref([])
const treinos = ref([])
const imagemErro = ref(false)
const exercicios = ref([])

const filters = reactive({
  search: '',
  statusTreino: 'Todos',
  exercicioSearch: '',
})

const treinoModal = reactive({
  open: false,
  isEdit: false,
  cliente: null,
  treino: null,
})

const imagemModal = reactive({
  open: false,
})

const imagemForm = reactive({
  url: '',
})

const exerciciosModal = reactive({
  open: false,
})

const treinoForm = reactive({
  id: null,
  cliente_id: null,
  nome: 'Ficha de treino',
  objetivo: 'Hipertrofia',
  nivel: 'Iniciante',
  frequencia_semanal: 3,
  tempo_por_treino: 60,
  origem: 'Manual',
  status: 'Ativo',
  revisao_status: 'Revisado',
  observacao: '',
})

const diasForm = ref([])

const exercicioForm = reactive({
  id: null,
  nome: '',
  aparelho: '',
  grupo_muscular: 'Peito',
  nivel: 'Todos',
  imagem_url: '',
  ativo: true,
})

const statusTreinoOptions = [
  { label: 'Todos', value: 'Todos' },
  { label: 'Com treino', value: 'ComTreino' },
  { label: 'Sem treino', value: 'SemTreino' },
  { label: 'Revisão pendente', value: 'RevisaoPendente' },
]

const objetivoOptions = [
  { label: 'Hipertrofia', value: 'Hipertrofia' },
  { label: 'Emagrecimento', value: 'Emagrecimento' },
  { label: 'Condicionamento', value: 'Condicionamento' },
  { label: 'Força', value: 'Força' },
  { label: 'Mobilidade', value: 'Mobilidade' },
  { label: 'Saúde geral', value: 'Saúde geral' },
]

const nivelOptions = [
  { label: 'Iniciante', value: 'Iniciante' },
  { label: 'Intermediário', value: 'Intermediário' },
  { label: 'Avançado', value: 'Avançado' },
]

const revisaoOptions = [
  { label: 'Pendente', value: 'Pendente' },
  { label: 'Revisado', value: 'Revisado' },
]

const statusFichaOptions = [
  { label: 'Ativo', value: 'Ativo' },
  { label: 'Arquivado', value: 'Arquivado' },
]

const grupoMuscularOptions = [
  { label: 'Peito', value: 'Peito' },
  { label: 'Costas', value: 'Costas' },
  { label: 'Pernas', value: 'Pernas' },
  { label: 'Ombros', value: 'Ombros' },
  { label: 'Bíceps', value: 'Bíceps' },
  { label: 'Tríceps', value: 'Tríceps' },
  { label: 'Abdômen', value: 'Abdômen' },
  { label: 'Cardio', value: 'Cardio' },
  { label: 'Mobilidade', value: 'Mobilidade' },
]

const nivelExercicioOptions = [
  { label: 'Todos', value: 'Todos' },
  { label: 'Iniciante', value: 'Iniciante' },
  { label: 'Intermediário', value: 'Intermediário' },
  { label: 'Avançado', value: 'Avançado' },
]

const clienteColumns = [
  {
    name: 'nome',
    label: 'Aluno',
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
    name: 'status',
    label: 'Status aluno',
    field: 'status',
    align: 'center',
  },
  {
    name: 'treino',
    label: 'Ficha atual',
    field: 'treino',
    align: 'left',
  },
  {
    name: 'revisao',
    label: 'Revisão',
    field: 'revisao',
    align: 'center',
  },
  {
    name: 'actions',
    label: 'Ações',
    field: 'actions',
    align: 'right',
  },
]

const exercicioColumns = [
  {
    name: 'nome',
    label: 'Exercício',
    field: 'nome',
    align: 'left',
    sortable: true,
  },
  {
    name: 'aparelho',
    label: 'Aparelho',
    field: 'aparelho',
    align: 'left',
  },
  {
    name: 'grupo_muscular',
    label: 'Grupo',
    field: 'grupo_muscular',
    align: 'left',
  },
  {
    name: 'nivel',
    label: 'Nível',
    field: 'nivel',
    align: 'left',
  },
  {
    name: 'imagem_url',
    label: 'Imagem',
    field: 'imagem_url',
    align: 'center',
  },
  {
    name: 'ativo',
    label: 'Status',
    field: 'ativo',
    align: 'center',
  },
  {
    name: 'actions',
    label: 'Ações',
    field: 'actions',
    align: 'right',
  },
]

const clientesFiltrados = computed(() => {
  let result = [...clientes.value]

  if (filters.search?.trim()) {
    const search = filters.search.trim().toLowerCase()

    result = result.filter((cliente) => {
      return (
        String(cliente.nome || '')
          .toLowerCase()
          .includes(search) ||
        String(cliente.email || '')
          .toLowerCase()
          .includes(search) ||
        String(cliente.telefone || '')
          .toLowerCase()
          .includes(search) ||
        String(cliente.cpf || '')
          .toLowerCase()
          .includes(search)
      )
    })
  }

  if (filters.statusTreino === 'ComTreino') {
    result = result.filter((cliente) => !!getTreinoAtivo(cliente.id))
  }

  if (filters.statusTreino === 'SemTreino') {
    result = result.filter((cliente) => !getTreinoAtivo(cliente.id))
  }

  if (filters.statusTreino === 'RevisaoPendente') {
    result = result.filter((cliente) => {
      const treino = getTreinoAtivo(cliente.id)
      return treino?.revisao_status === 'Pendente'
    })
  }

  return result
})

const exerciciosFiltrados = computed(() => {
  let result = [...exercicios.value]

  if (filters.exercicioSearch?.trim()) {
    const search = filters.exercicioSearch.trim().toLowerCase()

    result = result.filter((exercicio) => {
      return (
        String(exercicio.nome || '')
          .toLowerCase()
          .includes(search) ||
        String(exercicio.aparelho || '')
          .toLowerCase()
          .includes(search) ||
        String(exercicio.grupo_muscular || '')
          .toLowerCase()
          .includes(search)
      )
    })
  }

  return result
})

onMounted(async () => {
  await loadPage()
})

async function loadPage() {
  try {
    loading.value = true

    await Promise.all([loadClientes(), loadTreinos()])
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Erro ao carregar treinos',
    })
  } finally {
    loading.value = false
  }
}

async function loadClientes() {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nome', { ascending: true })

  if (error) {
    throw error
  }

  clientes.value = data || []
}

async function loadTreinos() {
  const { data, error } = await supabase
    .from('treinos')
    .select('*')
    .eq('status', 'Ativo')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  treinos.value = data || []
}

async function loadExercicios() {
  try {
    loadingExercicios.value = true

    const { data, error } = await supabase
      .from('exercicios')
      .select('*')
      .order('nome', { ascending: true })

    if (error) {
      throw error
    }

    exercicios.value = data || []
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Erro ao carregar exercícios',
    })
  } finally {
    loadingExercicios.value = false
  }
}

function getTreinoAtivo(clienteId) {
  return treinos.value.find((treino) => treino.cliente_id === clienteId)
}

function openCreateTreinoModal(cliente) {
  resetTreinoForm()

  treinoModal.open = true
  treinoModal.isEdit = false
  treinoModal.cliente = cliente
  treinoModal.treino = null

  treinoForm.cliente_id = cliente.id
  treinoForm.nome = `Ficha de treino - ${cliente.nome}`
  diasForm.value = [
    createDiaLocal('Treino A', 'Full body', 1),
    createDiaLocal('Treino B', 'Full body', 2),
    createDiaLocal('Treino C', 'Full body', 3),
  ]
}

async function openEditTreinoModal(cliente) {
  const treino = getTreinoAtivo(cliente.id)

  if (!treino) {
    openCreateTreinoModal(cliente)
    return
  }

  resetTreinoForm()

  treinoModal.open = true
  treinoModal.isEdit = true
  treinoModal.cliente = cliente
  treinoModal.treino = treino

  Object.assign(treinoForm, {
    id: treino.id,
    cliente_id: treino.cliente_id,
    nome: treino.nome || 'Ficha de treino',
    objetivo: treino.objetivo || 'Hipertrofia',
    nivel: treino.nivel || 'Iniciante',
    frequencia_semanal: treino.frequencia_semanal || 3,
    tempo_por_treino: treino.tempo_por_treino || 60,
    origem: treino.origem || 'Manual',
    status: treino.status || 'Ativo',
    revisao_status: treino.revisao_status || 'Revisado',
    observacao: treino.observacao || '',
  })

  await loadDiasTreino(treino.id)
}

async function loadDiasTreino(treinoId) {
  const { data, error } = await supabase
    .from('treino_dias')
    .select('*')
    .eq('treino_id', treinoId)
    .order('ordem', { ascending: true })

  if (error) {
    throw error
  }

  diasForm.value = (data || []).map((dia) => ({
    ...dia,
    local_id: dia.id,
  }))
}

function resetTreinoForm() {
  Object.assign(treinoForm, {
    id: null,
    cliente_id: null,
    nome: 'Ficha de treino',
    objetivo: 'Hipertrofia',
    nivel: 'Iniciante',
    frequencia_semanal: 3,
    tempo_por_treino: 60,
    origem: 'Manual',
    status: 'Ativo',
    revisao_status: 'Revisado',
    observacao: '',
  })

  diasForm.value = []
}

function createDiaLocal(nome, grupoFoco, ordem) {
  return {
    local_id: crypto.randomUUID(),
    id: null,
    nome,
    grupo_foco: grupoFoco,
    ordem,
  }
}

function addDia() {
  const nextOrder = diasForm.value.length + 1
  diasForm.value.push(
    createDiaLocal(`Treino ${String.fromCharCode(64 + nextOrder)}`, '', nextOrder),
  )
}

function removeDia(index) {
  diasForm.value.splice(index, 1)
}

async function saveTreino() {
  try {
    saving.value = true

    if (!treinoForm.cliente_id) {
      throw new Error('Cliente não informado')
    }

    const payload = {
      cliente_id: treinoForm.cliente_id,
      nome: treinoForm.nome,
      objetivo: treinoForm.objetivo,
      nivel: treinoForm.nivel,
      frequencia_semanal: Number(treinoForm.frequencia_semanal || 0),
      tempo_por_treino: Number(treinoForm.tempo_por_treino || 0),
      origem: treinoForm.origem,
      status: treinoForm.status,
      revisao_status: treinoForm.revisao_status,
      observacao: emptyToNull(treinoForm.observacao),
      updated_at: new Date().toISOString(),
    }

    let treinoId = treinoForm.id

    if (treinoModal.isEdit) {
      const { error } = await supabase.from('treinos').update(payload).eq('id', treinoForm.id)

      if (error) {
        throw error
      }
    } else {
      await arquivarTreinosAtivosDoCliente(treinoForm.cliente_id)

      const { data, error } = await supabase.from('treinos').insert(payload).select().single()

      if (error) {
        throw error
      }

      treinoId = data.id
    }

    await saveDiasTreino(treinoId)

    $q.notify({
      type: 'positive',
      message: 'Ficha de treino salva com sucesso',
    })

    treinoModal.open = false
    await loadTreinos()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Erro ao salvar ficha',
    })
  } finally {
    saving.value = false
  }
}

async function arquivarTreinosAtivosDoCliente(clienteId) {
  const { error } = await supabase
    .from('treinos')
    .update({
      status: 'Arquivado',
      updated_at: new Date().toISOString(),
    })
    .eq('cliente_id', clienteId)
    .eq('status', 'Ativo')

  if (error) {
    throw error
  }
}

async function saveDiasTreino(treinoId) {
  const { error: deleteError } = await supabase
    .from('treino_dias')
    .delete()
    .eq('treino_id', treinoId)

  if (deleteError) {
    throw deleteError
  }

  const diasPayload = diasForm.value
    .filter((dia) => dia.nome?.trim())
    .map((dia, index) => ({
      treino_id: treinoId,
      nome: dia.nome,
      grupo_foco: emptyToNull(dia.grupo_foco),
      ordem: Number(dia.ordem || index + 1),
    }))

  if (diasPayload.length === 0) {
    return
  }

  const { error } = await supabase.from('treino_dias').insert(diasPayload)

  if (error) {
    throw error
  }
}

async function openExerciciosModal() {
  exerciciosModal.open = true
  resetExercicioForm()
  await loadExercicios()
}

function resetExercicioForm() {
  Object.assign(exercicioForm, {
    id: null,
    nome: '',
    aparelho: '',
    grupo_muscular: 'Peito',
    nivel: 'Todos',
    imagem_url: '',
    ativo: true,
  })
}

function editExercicio(exercicio) {
  Object.assign(exercicioForm, {
    id: exercicio.id,
    nome: exercicio.nome || '',
    aparelho: exercicio.aparelho || '',
    grupo_muscular: exercicio.grupo_muscular || 'Peito',
    nivel: exercicio.nivel || 'Todos',
    imagem_url: exercicio.imagem_url || '',
    ativo: exercicio.ativo,
  })
}

async function saveExercicio() {
  try {
    savingExercicio.value = true

    const payload = {
      nome: exercicioForm.nome,
      aparelho: emptyToNull(exercicioForm.aparelho),
      grupo_muscular: emptyToNull(exercicioForm.grupo_muscular),
      nivel: exercicioForm.nivel || 'Todos',
      imagem_url: emptyToNull(exercicioForm.imagem_url),
      ativo: exercicioForm.ativo,
    }

    if (exercicioForm.id) {
      const { error } = await supabase.from('exercicios').update(payload).eq('id', exercicioForm.id)

      if (error) {
        throw error
      }

      $q.notify({
        type: 'positive',
        message: 'Exercício atualizado com sucesso',
      })
    } else {
      const { error } = await supabase.from('exercicios').insert(payload)

      if (error) {
        throw error
      }

      $q.notify({
        type: 'positive',
        message: 'Exercício cadastrado com sucesso',
      })
    }

    resetExercicioForm()
    await loadExercicios()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Erro ao salvar exercício',
    })
  } finally {
    savingExercicio.value = false
  }
}

function confirmDeleteExercicio(exercicio) {
  $q.dialog({
    title: 'Excluir exercício',
    message: `Deseja excluir o exercício "${exercicio.nome}"?`,
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
    await deleteExercicio(exercicio)
  })
}

async function deleteExercicio(exercicio) {
  try {
    loadingExercicios.value = true

    const { error } = await supabase.from('exercicios').delete().eq('id', exercicio.id)

    if (error) {
      throw error
    }

    $q.notify({
      type: 'positive',
      message: 'Exercício excluído com sucesso',
    })

    await loadExercicios()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Erro ao excluir exercício',
    })
  } finally {
    loadingExercicios.value = false
  }
}

function emptyToNull(value) {
  if (value === undefined || value === null) {
    return null
  }

  const text = String(value).trim()

  return text === '' ? null : text
}

function openImagemModal() {
  imagemForm.url = exercicioForm.imagem_url || ''
  imagemErro.value = false
  imagemModal.open = true
}

function applyImagem() {
  exercicioForm.imagem_url = emptyToNull(imagemForm.url)
  imagemErro.value = false
  imagemModal.open = false
}

function removeImagem() {
  imagemForm.url = ''
  exercicioForm.imagem_url = ''
  imagemModal.open = false
}
</script>

<style scoped>
.image-preview-box {
  position: relative;
  width: 100%;
  min-height: 220px;
  border-radius: 8px;
  overflow: hidden;
  background: #eeeeee;
}

.image-preview {
  width: 100%;
  height: 220px;
  object-fit: contain;
  display: block;
}

.image-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  text-align: center;
  background: #eeeeee;
  color: #555;
}
</style>
