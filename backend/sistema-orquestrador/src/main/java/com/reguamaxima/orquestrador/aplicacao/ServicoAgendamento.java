package com.reguamaxima.orquestrador.aplicacao;

import com.reguamaxima.autenticacao.dominio.entidade.Usuario;
import com.reguamaxima.autenticacao.dominio.repository.UsuarioRepository;
import com.reguamaxima.kernel.exception.RegraNegocioException;
import com.reguamaxima.kernel.exception.RecursoNaoEncontradoException;
import com.reguamaxima.orquestrador.dominio.dto.*;
import com.reguamaxima.orquestrador.dominio.entidade.*;
import com.reguamaxima.orquestrador.dominio.enums.StatusAgendamento;
import com.reguamaxima.orquestrador.dominio.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Serviço de aplicação para gerenciamento de Agendamentos.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ServicoAgendamento {

    private final AgendamentoRepository agendamentoRepository;
    private final BarbeiroRepository barbeiroRepository;
    private final ServicoRepository servicoRepository;
    private final UsuarioRepository usuarioRepository;

    // Status que indicam cancelamento
    private static final List<StatusAgendamento> STATUS_CANCELADOS = List.of(
            StatusAgendamento.CANCELADO_CLIENTE,
            StatusAgendamento.CANCELADO_BARBEIRO,
            StatusAgendamento.CANCELADO_BARBEARIA);

    // Status que indicam finalização
    private static final List<StatusAgendamento> STATUS_FINALIZADOS = List.of(
            StatusAgendamento.CONCLUIDO,
            StatusAgendamento.NAO_COMPARECEU,
            StatusAgendamento.CANCELADO_CLIENTE,
            StatusAgendamento.CANCELADO_BARBEIRO,
            StatusAgendamento.CANCELADO_BARBEARIA);

    // Status ativos (não cancelados)
    private static final List<StatusAgendamento> STATUS_ATIVOS = List.of(
            StatusAgendamento.PENDENTE,
            StatusAgendamento.CONFIRMADO,
            StatusAgendamento.EM_ANDAMENTO);

    // ========== CRUD Básico ==========

    /**
     * Busca agendamento por ID com detalhes.
     */
    @Transactional(readOnly = true)
    public AgendamentoDTO buscarPorId(Long id) {
        return agendamentoRepository.findByIdComDetalhes(id)
                .map(AgendamentoDTO::fromEntity)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Agendamento não encontrado"));
    }

    /**
     * Cria um novo agendamento.
     */
    @Transactional
    public AgendamentoDTO criarAgendamento(Long clienteId, CriarAgendamentoDTO dto) {
        log.info("Criando agendamento para cliente {} com barbeiro {} na data {}",
                clienteId, dto.barbeiroId(), dto.data());

        // Buscar entidades
        Usuario cliente = usuarioRepository.findById(clienteId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente não encontrado"));

        Barbeiro barbeiro = barbeiroRepository.findById(dto.barbeiroId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Barbeiro não encontrado"));

        if (!Boolean.TRUE.equals(barbeiro.getAtivo())) {
            throw new RegraNegocioException("Este barbeiro não está disponível no momento");
        }

        Servico servico = servicoRepository.findById(dto.servicoId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Serviço não encontrado"));

        if (!servico.getAtivo()) {
            throw new RegraNegocioException("Este serviço não está disponível");
        }

        // Validar se o serviço pertence à barbearia do barbeiro
        Barbearia barbearia = barbeiro.getBarbearia();
        if (barbearia == null) {
            throw new RegraNegocioException("Barbeiro não está vinculado a uma barbearia");
        }

        if (!servico.getBarbearia().getId().equals(barbearia.getId())) {
            throw new RegraNegocioException("Serviço não pertence à barbearia do barbeiro selecionado");
        }

        // Validar data
        if (dto.data().isBefore(LocalDate.now())) {
            throw new RegraNegocioException("Não é possível agendar para uma data passada");
        }

        if (dto.data().equals(LocalDate.now()) && dto.horaInicio().isBefore(LocalTime.now())) {
            throw new RegraNegocioException("Não é possível agendar para um horário que já passou");
        }

        // Calcular hora de fim
        LocalTime horaFim = dto.horaInicio().plusMinutes(servico.getDuracaoMinutos());

        // Verificar conflito de horário
        boolean temConflito = agendamentoRepository.existeConflitoHorario(
                barbeiro.getId(),
                dto.data(),
                dto.horaInicio(),
                horaFim,
                STATUS_CANCELADOS);

        if (temConflito) {
            throw new RegraNegocioException("Este horário não está disponível. Por favor, escolha outro horário.");
        }

        // Criar agendamento
        Agendamento agendamento = Agendamento.builder()
                .cliente(cliente)
                .barbeiro(barbeiro)
                .barbearia(barbearia)
                .servico(servico)
                .data(dto.data())
                .horaInicio(dto.horaInicio())
                .horaFim(horaFim)
                .duracaoMinutos(servico.getDuracaoMinutos())
                .preco(servico.getPreco())
                .status(StatusAgendamento.PENDENTE)
                .observacoesCliente(dto.observacoes())
                .build();

        agendamento = agendamentoRepository.save(agendamento);

        log.info("Agendamento {} criado com sucesso", agendamento.getId());

        return AgendamentoDTO.fromEntity(agendamento);
    }

    // ========== Ações de Status ==========

    /**
     * Confirma um agendamento (barbeiro/barbearia).
     */
    @Transactional
    public AgendamentoDTO confirmarAgendamento(Long agendamentoId, Long barbeiroId) {
        Agendamento agendamento = buscarAgendamentoValidandoBarbeiro(agendamentoId, barbeiroId);

        agendamento.confirmar();
        agendamentoRepository.save(agendamento);

        log.info("Agendamento {} confirmado", agendamentoId);

        return AgendamentoDTO.fromEntity(agendamento);
    }

    /**
     * Inicia o atendimento de um agendamento.
     */
    @Transactional
    public AgendamentoDTO iniciarAtendimento(Long agendamentoId, Long barbeiroId) {
        Agendamento agendamento = buscarAgendamentoValidandoBarbeiro(agendamentoId, barbeiroId);

        agendamento.iniciarAtendimento();
        agendamentoRepository.save(agendamento);

        log.info("Atendimento do agendamento {} iniciado", agendamentoId);

        return AgendamentoDTO.fromEntity(agendamento);
    }

    /**
     * Conclui um agendamento.
     */
    @Transactional
    public AgendamentoDTO concluirAgendamento(Long agendamentoId, Long barbeiroId) {
        Agendamento agendamento = buscarAgendamentoValidandoBarbeiro(agendamentoId, barbeiroId);

        agendamento.concluir();
        agendamentoRepository.save(agendamento);

        log.info("Agendamento {} concluído", agendamentoId);

        return AgendamentoDTO.fromEntity(agendamento);
    }

    /**
     * Marca cliente como não compareceu.
     */
    @Transactional
    public AgendamentoDTO marcarNaoCompareceu(Long agendamentoId, Long barbeiroId) {
        Agendamento agendamento = buscarAgendamentoValidandoBarbeiro(agendamentoId, barbeiroId);

        agendamento.marcarNaoCompareceu();
        agendamentoRepository.save(agendamento);

        log.info("Agendamento {} marcado como não compareceu", agendamentoId);

        return AgendamentoDTO.fromEntity(agendamento);
    }

    /**
     * Cancela agendamento pelo cliente.
     */
    @Transactional
    public AgendamentoDTO cancelarPeloCliente(Long agendamentoId, Long clienteId, CancelarAgendamentoDTO dto) {
        Agendamento agendamento = agendamentoRepository.findByIdComDetalhes(agendamentoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Agendamento não encontrado"));

        if (!agendamento.getCliente().getId().equals(clienteId)) {
            throw new RegraNegocioException("Você não tem permissão para cancelar este agendamento");
        }

        agendamento.cancelarPeloCliente(dto != null ? dto.motivo() : null);
        agendamentoRepository.save(agendamento);

        log.info("Agendamento {} cancelado pelo cliente", agendamentoId);

        return AgendamentoDTO.fromEntity(agendamento);
    }

    /**
     * Cancela agendamento pelo barbeiro.
     */
    @Transactional
    public AgendamentoDTO cancelarPeloBarbeiro(Long agendamentoId, Long barbeiroId, CancelarAgendamentoDTO dto) {
        Agendamento agendamento = buscarAgendamentoValidandoBarbeiro(agendamentoId, barbeiroId);

        agendamento.cancelarPeloBarbeiro(dto != null ? dto.motivo() : null);
        agendamentoRepository.save(agendamento);

        log.info("Agendamento {} cancelado pelo barbeiro", agendamentoId);

        return AgendamentoDTO.fromEntity(agendamento);
    }

    // ========== Consultas Cliente ==========

    /**
     * Busca próximos agendamentos do cliente.
     */
    @Transactional(readOnly = true)
    public List<AgendamentoDTO> buscarProximosAgendamentosCliente(Long clienteId) {
        return agendamentoRepository.findAgendamentosFuturosCliente(
                clienteId,
                LocalDate.now(),
                LocalTime.now(),
                STATUS_FINALIZADOS).stream()
                .map(AgendamentoDTO::fromEntity)
                .toList();
    }

    /**
     * Busca histórico de agendamentos do cliente.
     */
    @Transactional(readOnly = true)
    public Page<AgendamentoDTO> buscarHistoricoCliente(Long clienteId, Pageable pageable) {
        return agendamentoRepository.findHistoricoCliente(clienteId, STATUS_FINALIZADOS, pageable)
                .map(AgendamentoDTO::fromEntity);
    }

    // ========== Consultas Barbeiro ==========

    /**
     * Busca agenda do barbeiro para uma data.
     */
    @Transactional(readOnly = true)
    public List<AgendamentoDTO> buscarAgendaDia(Long barbeiroId, LocalDate data) {
        return agendamentoRepository.findByBarbeiroIdAndData(barbeiroId, data, STATUS_CANCELADOS)
                .stream()
                .map(AgendamentoDTO::fromEntity)
                .toList();
    }

    /**
     * Busca próximos agendamentos do barbeiro.
     */
    @Transactional(readOnly = true)
    public List<AgendamentoDTO> buscarProximosAgendamentosBarbeiro(Long barbeiroId) {
        return agendamentoRepository.findAgendaFuturaBarbeiro(
                barbeiroId,
                LocalDate.now(),
                LocalTime.now(),
                STATUS_ATIVOS).stream()
                .map(AgendamentoDTO::fromEntity)
                .toList();
    }

    /**
     * Busca agendamentos pendentes para confirmação.
     */
    @Transactional(readOnly = true)
    public List<AgendamentoDTO> buscarPendentesConfirmacao(Long barbeiroId) {
        Barbeiro barbeiro = barbeiroRepository.findById(barbeiroId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Barbeiro não encontrado"));

        if (barbeiro.getBarbearia() == null) {
            return List.of();
        }

        return agendamentoRepository.findPendentesBarbearia(
                barbeiro.getBarbearia().getId(),
                StatusAgendamento.PENDENTE).stream()
                .map(AgendamentoDTO::fromEntity)
                .toList();
    }

    // ========== Disponibilidade ==========

    /**
     * Busca horários disponíveis para um barbeiro em uma data.
     */
    @Transactional(readOnly = true)
    public List<HorarioDisponivelDTO> buscarHorariosDisponiveis(Long barbeiroId, Long servicoId, LocalDate data) {
        Barbeiro barbeiro = barbeiroRepository.findById(barbeiroId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Barbeiro não encontrado"));

        Servico servico = servicoRepository.findById(servicoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Serviço não encontrado"));

        int duracaoMinutos = servico.getDuracaoMinutos();

        // Horário de funcionamento padrão (pode ser configurável por barbearia)
        LocalTime abertura = LocalTime.of(8, 0);
        LocalTime fechamento = LocalTime.of(20, 0);
        int intervaloMinutos = 30; // Slots de 30 em 30 minutos

        // Buscar horários ocupados
        List<Object[]> horariosOcupados = agendamentoRepository.findHorariosOcupados(
                barbeiroId, data, STATUS_CANCELADOS);

        List<HorarioDisponivelDTO> horarios = new ArrayList<>();
        LocalTime horarioAtual = abertura;
        LocalTime agora = LocalTime.now();
        boolean isHoje = data.equals(LocalDate.now());

        while (horarioAtual.plusMinutes(duracaoMinutos).compareTo(fechamento) <= 0) {
            LocalTime horaFim = horarioAtual.plusMinutes(duracaoMinutos);

            // Verificar se é horário passado (para hoje)
            boolean passado = isHoje && horarioAtual.isBefore(agora);

            // Verificar conflitos
            boolean ocupado = false;
            for (Object[] ocupacao : horariosOcupados) {
                LocalTime ocupadoInicio = (LocalTime) ocupacao[0];
                LocalTime ocupadoFim = (LocalTime) ocupacao[1];

                // Verifica sobreposição
                if (!(horaFim.compareTo(ocupadoInicio) <= 0 || horarioAtual.compareTo(ocupadoFim) >= 0)) {
                    ocupado = true;
                    break;
                }
            }

            if (passado || ocupado) {
                horarios.add(HorarioDisponivelDTO.indisponivel(horarioAtual));
            } else {
                horarios.add(HorarioDisponivelDTO.disponivel(horarioAtual));
            }

            horarioAtual = horarioAtual.plusMinutes(intervaloMinutos);
        }

        return horarios;
    }

    // ========== Métodos Auxiliares ==========

    private Agendamento buscarAgendamentoValidandoBarbeiro(Long agendamentoId, Long barbeiroId) {
        Agendamento agendamento = agendamentoRepository.findByIdComDetalhes(agendamentoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Agendamento não encontrado"));

        if (!agendamento.getBarbeiro().getId().equals(barbeiroId)) {
            throw new RegraNegocioException("Você não tem permissão para alterar este agendamento");
        }

        return agendamento;
    }
}
