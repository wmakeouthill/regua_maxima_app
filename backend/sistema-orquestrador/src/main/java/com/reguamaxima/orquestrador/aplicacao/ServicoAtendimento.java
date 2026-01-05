package com.reguamaxima.orquestrador.aplicacao;

import com.reguamaxima.autenticacao.dominio.entidade.Usuario;
import com.reguamaxima.autenticacao.dominio.repository.UsuarioRepository;
import com.reguamaxima.orquestrador.dominio.dto.*;
import com.reguamaxima.orquestrador.dominio.entidade.Atendimento;
import com.reguamaxima.orquestrador.dominio.entidade.Atendimento.StatusAtendimento;
import com.reguamaxima.orquestrador.dominio.entidade.Barbearia;
import com.reguamaxima.orquestrador.dominio.entidade.Barbeiro;
import com.reguamaxima.orquestrador.dominio.entidade.Servico;
import com.reguamaxima.orquestrador.dominio.repository.AtendimentoRepository;
import com.reguamaxima.orquestrador.dominio.repository.BarbeariaRepository;
import com.reguamaxima.orquestrador.dominio.repository.BarbeiroRepository;
import com.reguamaxima.orquestrador.dominio.repository.ServicoRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Serviço de aplicação para gestão de atendimentos/fila do barbeiro.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ServicoAtendimento {

    private final AtendimentoRepository atendimentoRepository;
    private final BarbeiroRepository barbeiroRepository;
    private final UsuarioRepository usuarioRepository;
    private final ServicoRepository servicoRepository;
    private final BarbeariaRepository barbeariaRepository;

    // ========== Operações do Barbeiro ==========

    /**
     * Busca a fila completa do barbeiro para hoje.
     */
    @Transactional(readOnly = true)
    public FilaBarbeiroDTO buscarMinhaFila(Long usuarioId) {
        log.debug("Buscando fila do barbeiro - usuário: {}", usuarioId);

        Barbeiro barbeiro = barbeiroRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Perfil de barbeiro não encontrado"));

        return buscarFilaDoBarbeiro(barbeiro.getId());
    }

    /**
     * Busca a fila de um barbeiro específico.
     */
    @Transactional(readOnly = true)
    public FilaBarbeiroDTO buscarFilaDoBarbeiro(Long barbeiroId) {
        Barbeiro barbeiro = barbeiroRepository.findById(barbeiroId)
                .orElseThrow(() -> new EntityNotFoundException("Barbeiro não encontrado"));

        LocalDate hoje = LocalDate.now();

        // Buscar atendimento atual
        Optional<Atendimento> atendimentoAtual = atendimentoRepository
                .findAtendimentoAtual(barbeiroId, hoje);

        // Buscar fila de espera
        List<Atendimento> filaEspera = atendimentoRepository
                .findFilaEspera(barbeiroId, hoje);

        // Estatísticas
        Integer totalAtendidosHoje = atendimentoRepository
                .countAtendidosHoje(barbeiroId, hoje);

        Double tempoMedioEspera = atendimentoRepository
                .calcularTempoMedioEspera(barbeiroId, hoje);

        Double tempoMedioAtendimento = atendimentoRepository
                .calcularTempoMedioAtendimento(barbeiroId, hoje);

        String nomeBarbeiro = barbeiro.getNomeProfissional() != null
                ? barbeiro.getNomeProfissional()
                : barbeiro.getUsuario().getNome();

        return new FilaBarbeiroDTO(
                barbeiroId,
                nomeBarbeiro,
                atendimentoAtual.map(AtendimentoDTO::fromEntity).orElse(null),
                filaEspera.stream().map(AtendimentoDTO::fromEntity).toList(),
                filaEspera.size(),
                totalAtendidosHoje,
                tempoMedioEspera != null ? tempoMedioEspera.longValue() : 0L,
                tempoMedioAtendimento != null ? tempoMedioAtendimento.longValue() : 0L);
    }

    /**
     * Adiciona cliente na fila do barbeiro.
     */
    @Transactional
    public AtendimentoDTO adicionarNaFila(Long usuarioIdBarbeiro, CriarAtendimentoDTO dto) {
        log.info("Adicionando cliente {} na fila do barbeiro (usuário: {})",
                dto.clienteId(), usuarioIdBarbeiro);

        Barbeiro barbeiro = barbeiroRepository.findByUsuarioId(usuarioIdBarbeiro)
                .orElseThrow(() -> new EntityNotFoundException("Perfil de barbeiro não encontrado"));

        // Verificar se cliente já está em alguma fila
        if (atendimentoRepository.clienteEstaEmFila(dto.clienteId())) {
            throw new IllegalStateException("Cliente já está em uma fila de atendimento");
        }

        Usuario cliente = usuarioRepository.findById(dto.clienteId())
                .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado"));

        Servico servico = servicoRepository.findById(dto.servicoId())
                .orElseThrow(() -> new EntityNotFoundException("Serviço não encontrado"));

        Barbearia barbearia = null;
        if (dto.barbeariaId() != null) {
            barbearia = barbeariaRepository.findById(dto.barbeariaId())
                    .orElseThrow(() -> new EntityNotFoundException("Barbearia não encontrada"));
        } else if (barbeiro.getBarbearia() != null) {
            barbearia = barbeiro.getBarbearia();
        }

        LocalDate hoje = LocalDate.now();

        // Calcular posição na fila
        List<Atendimento> filaAtual = atendimentoRepository.findFilaEspera(barbeiro.getId(), hoje);
        int posicao = filaAtual.size() + 1;

        Atendimento atendimento = Atendimento.builder()
                .barbeiro(barbeiro)
                .cliente(cliente)
                .servico(servico)
                .barbearia(barbearia)
                .status(StatusAtendimento.AGUARDANDO)
                .dataAtendimento(hoje)
                .horaChegada(LocalDateTime.now())
                .posicaoFila(posicao)
                .observacoes(dto.observacoes())
                .build();

        atendimento = atendimentoRepository.save(atendimento);
        log.info("Cliente adicionado na fila - Atendimento ID: {}, Posição: {}",
                atendimento.getId(), posicao);

        return AtendimentoDTO.fromEntity(atendimento);
    }

    /**
     * Inicia o próximo atendimento da fila.
     */
    @Transactional
    public AtendimentoDTO iniciarProximoAtendimento(Long usuarioIdBarbeiro) {
        log.info("Iniciando próximo atendimento para barbeiro (usuário: {})", usuarioIdBarbeiro);

        Barbeiro barbeiro = barbeiroRepository.findByUsuarioId(usuarioIdBarbeiro)
                .orElseThrow(() -> new EntityNotFoundException("Perfil de barbeiro não encontrado"));

        LocalDate hoje = LocalDate.now();

        // Verificar se já tem atendimento em andamento
        if (atendimentoRepository.barbeiroTemAtendimentoEmAndamento(barbeiro.getId())) {
            throw new IllegalStateException("Já existe um atendimento em andamento. Finalize-o primeiro.");
        }

        // Pegar o primeiro da fila
        List<Atendimento> fila = atendimentoRepository.findFilaEspera(barbeiro.getId(), hoje);
        if (fila.isEmpty()) {
            throw new IllegalStateException("Não há clientes na fila de espera");
        }

        Atendimento proximo = fila.get(0);
        proximo.iniciar();

        proximo = atendimentoRepository.save(proximo);

        // Recalcular posições da fila
        atendimentoRepository.recalcularPosicoesFila(barbeiro.getId(), hoje);

        log.info("Atendimento {} iniciado", proximo.getId());
        return AtendimentoDTO.fromEntity(proximo);
    }

    /**
     * Inicia atendimento de um cliente específico (fora de ordem).
     */
    @Transactional
    public AtendimentoDTO iniciarAtendimento(Long usuarioIdBarbeiro, Long atendimentoId) {
        log.info("Iniciando atendimento {} (usuário barbeiro: {})", atendimentoId, usuarioIdBarbeiro);

        Barbeiro barbeiro = barbeiroRepository.findByUsuarioId(usuarioIdBarbeiro)
                .orElseThrow(() -> new EntityNotFoundException("Perfil de barbeiro não encontrado"));

        // Verificar se já tem atendimento em andamento
        if (atendimentoRepository.barbeiroTemAtendimentoEmAndamento(barbeiro.getId())) {
            throw new IllegalStateException("Já existe um atendimento em andamento. Finalize-o primeiro.");
        }

        Atendimento atendimento = atendimentoRepository.findById(atendimentoId)
                .orElseThrow(() -> new EntityNotFoundException("Atendimento não encontrado"));

        // Verificar se pertence ao barbeiro
        if (!atendimento.getBarbeiro().getId().equals(barbeiro.getId())) {
            throw new IllegalStateException("Este atendimento não pertence a você");
        }

        atendimento.iniciar();
        atendimento = atendimentoRepository.save(atendimento);

        // Recalcular posições
        atendimentoRepository.recalcularPosicoesFila(barbeiro.getId(), atendimento.getDataAtendimento());

        log.info("Atendimento {} iniciado", atendimento.getId());
        return AtendimentoDTO.fromEntity(atendimento);
    }

    /**
     * Finaliza o atendimento atual.
     */
    @Transactional
    public AtendimentoDTO finalizarAtendimento(Long usuarioIdBarbeiro) {
        log.info("Finalizando atendimento atual (usuário barbeiro: {})", usuarioIdBarbeiro);

        Barbeiro barbeiro = barbeiroRepository.findByUsuarioId(usuarioIdBarbeiro)
                .orElseThrow(() -> new EntityNotFoundException("Perfil de barbeiro não encontrado"));

        LocalDate hoje = LocalDate.now();

        Atendimento atendimentoAtual = atendimentoRepository
                .findAtendimentoAtual(barbeiro.getId(), hoje)
                .orElseThrow(() -> new IllegalStateException("Não há atendimento em andamento"));

        atendimentoAtual.finalizar();
        atendimentoAtual = atendimentoRepository.save(atendimentoAtual);

        // Incrementar contador de atendimentos do barbeiro
        barbeiro.setTotalAtendimentos(barbeiro.getTotalAtendimentos() + 1);
        barbeiroRepository.save(barbeiro);

        log.info("Atendimento {} finalizado", atendimentoAtual.getId());
        return AtendimentoDTO.fromEntity(atendimentoAtual);
    }

    /**
     * Cancela um atendimento.
     */
    @Transactional
    public AtendimentoDTO cancelarAtendimento(Long usuarioIdBarbeiro, Long atendimentoId, String motivo) {
        log.info("Cancelando atendimento {} (usuário barbeiro: {})", atendimentoId, usuarioIdBarbeiro);

        Barbeiro barbeiro = barbeiroRepository.findByUsuarioId(usuarioIdBarbeiro)
                .orElseThrow(() -> new EntityNotFoundException("Perfil de barbeiro não encontrado"));

        Atendimento atendimento = atendimentoRepository.findById(atendimentoId)
                .orElseThrow(() -> new EntityNotFoundException("Atendimento não encontrado"));

        if (!atendimento.getBarbeiro().getId().equals(barbeiro.getId())) {
            throw new IllegalStateException("Este atendimento não pertence a você");
        }

        atendimento.cancelar(motivo);
        atendimento = atendimentoRepository.save(atendimento);

        // Recalcular posições
        atendimentoRepository.recalcularPosicoesFila(barbeiro.getId(), atendimento.getDataAtendimento());

        log.info("Atendimento {} cancelado", atendimento.getId());
        return AtendimentoDTO.fromEntity(atendimento);
    }

    /**
     * Marca cliente como não compareceu.
     */
    @Transactional
    public AtendimentoDTO marcarNaoCompareceu(Long usuarioIdBarbeiro, Long atendimentoId) {
        log.info("Marcando não compareceu - atendimento {} (usuário barbeiro: {})",
                atendimentoId, usuarioIdBarbeiro);

        Barbeiro barbeiro = barbeiroRepository.findByUsuarioId(usuarioIdBarbeiro)
                .orElseThrow(() -> new EntityNotFoundException("Perfil de barbeiro não encontrado"));

        Atendimento atendimento = atendimentoRepository.findById(atendimentoId)
                .orElseThrow(() -> new EntityNotFoundException("Atendimento não encontrado"));

        if (!atendimento.getBarbeiro().getId().equals(barbeiro.getId())) {
            throw new IllegalStateException("Este atendimento não pertence a você");
        }

        atendimento.marcarNaoCompareceu();
        atendimento = atendimentoRepository.save(atendimento);

        // Recalcular posições
        atendimentoRepository.recalcularPosicoesFila(barbeiro.getId(), atendimento.getDataAtendimento());

        log.info("Atendimento {} marcado como não compareceu", atendimento.getId());
        return AtendimentoDTO.fromEntity(atendimento);
    }

    // ========== Operações do Cliente ==========

    /**
     * Busca atendimento ativo do cliente (se estiver em alguma fila).
     */
    @Transactional(readOnly = true)
    public Optional<AtendimentoDTO> buscarMeuAtendimentoAtivo(Long clienteId) {
        return atendimentoRepository.findAtendimentoAtivoCliente(clienteId)
                .map(AtendimentoDTO::fromEntity);
    }

    /**
     * Busca histórico de atendimentos do cliente.
     */
    @Transactional(readOnly = true)
    public Page<AtendimentoDTO> buscarHistoricoCliente(Long clienteId, Pageable pageable) {
        return atendimentoRepository.findByClienteId(clienteId, pageable)
                .map(AtendimentoDTO::fromEntity);
    }

    // ========== Operações da Barbearia ==========

    /**
     * Busca todos os atendimentos da barbearia hoje.
     */
    @Transactional(readOnly = true)
    public List<AtendimentoDTO> buscarAtendimentosDaBarbearia(Long barbeariaId, LocalDate data) {
        return atendimentoRepository.findByBarbeariaAndData(barbeariaId, data)
                .stream()
                .map(AtendimentoDTO::fromEntity)
                .toList();
    }
}
