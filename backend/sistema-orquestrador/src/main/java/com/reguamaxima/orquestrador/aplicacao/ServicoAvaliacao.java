package com.reguamaxima.orquestrador.aplicacao;

import com.reguamaxima.autenticacao.dominio.entidade.Usuario;
import com.reguamaxima.autenticacao.dominio.repository.UsuarioRepository;
import com.reguamaxima.orquestrador.dominio.dto.*;
import com.reguamaxima.orquestrador.dominio.entidade.*;
import com.reguamaxima.orquestrador.dominio.enums.StatusAgendamento;
import com.reguamaxima.orquestrador.dominio.enums.TipoAvaliacao;
import com.reguamaxima.orquestrador.dominio.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Serviço de aplicação para gerenciamento de avaliações.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ServicoAvaliacao {

    private final AvaliacaoRepository avaliacaoRepository;
    private final UsuarioRepository usuarioRepository;
    private final BarbeariaRepository barbeariaRepository;
    private final BarbeiroRepository barbeiroRepository;
    private final AgendamentoRepository agendamentoRepository;

    // ========== Criar Avaliação ==========

    /**
     * Cria uma nova avaliação.
     */
    @Transactional
    public AvaliacaoDTO criarAvaliacao(Long clienteId, CriarAvaliacaoDTO dto) {
        log.info("Criando avaliação - cliente: {}, tipo: {}, nota: {}", clienteId, dto.tipo(), dto.nota());

        // Validar DTO
        if (!dto.isValido()) {
            throw new IllegalArgumentException(dto.getMensagemErro());
        }

        // Buscar cliente
        Usuario cliente = usuarioRepository.findById(clienteId)
                .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado"));

        Avaliacao avaliacao = Avaliacao.builder()
                .cliente(cliente)
                .tipo(dto.tipo())
                .nota(dto.nota())
                .comentario(dto.comentario())
                .anonima(dto.anonima() != null ? dto.anonima() : false)
                .build();

        // Configurar relacionamentos baseado no tipo
        switch (dto.tipo()) {
            case BARBEARIA:
                validarAvaliacaoBarbearia(clienteId, dto);
                Barbearia barbearia = barbeariaRepository.findById(dto.barbeariaId())
                        .orElseThrow(() -> new EntityNotFoundException("Barbearia não encontrada"));
                avaliacao.setBarbearia(barbearia);
                break;

            case BARBEIRO:
                validarAvaliacaoBarbeiro(clienteId, dto);
                Barbeiro barbeiro = barbeiroRepository.findById(dto.barbeiroId())
                        .orElseThrow(() -> new EntityNotFoundException("Barbeiro não encontrado"));
                avaliacao.setBarbeiro(barbeiro);
                break;

            case ATENDIMENTO:
                Agendamento agendamento = validarAvaliacaoAtendimento(clienteId, dto);
                avaliacao.setAgendamento(agendamento);
                avaliacao.setBarbearia(agendamento.getBarbearia());
                avaliacao.setBarbeiro(agendamento.getBarbeiro());
                break;
        }

        avaliacao = avaliacaoRepository.save(avaliacao);
        log.info("Avaliação criada com sucesso: id={}", avaliacao.getId());

        // Atualizar média da barbearia/barbeiro (em background seria ideal)
        atualizarMedias(avaliacao);

        return AvaliacaoDTO.fromEntity(avaliacao);
    }

    private void validarAvaliacaoBarbearia(Long clienteId, CriarAvaliacaoDTO dto) {
        if (avaliacaoRepository.existsByClienteIdAndBarbeariaIdAndTipo(
                clienteId, dto.barbeariaId(), TipoAvaliacao.BARBEARIA)) {
            throw new IllegalStateException("Você já avaliou esta barbearia");
        }
    }

    private void validarAvaliacaoBarbeiro(Long clienteId, CriarAvaliacaoDTO dto) {
        if (avaliacaoRepository.existsByClienteIdAndBarbeiroIdAndTipo(
                clienteId, dto.barbeiroId(), TipoAvaliacao.BARBEIRO)) {
            throw new IllegalStateException("Você já avaliou este barbeiro");
        }
    }

    private Agendamento validarAvaliacaoAtendimento(Long clienteId, CriarAvaliacaoDTO dto) {
        // Buscar agendamento
        Agendamento agendamento = agendamentoRepository.findById(dto.agendamentoId())
                .orElseThrow(() -> new EntityNotFoundException("Agendamento não encontrado"));

        // Verificar se é do cliente
        if (!agendamento.getCliente().getId().equals(clienteId)) {
            throw new IllegalArgumentException("Este agendamento não pertence a você");
        }

        // Verificar se foi concluído
        if (agendamento.getStatus() != StatusAgendamento.CONCLUIDO) {
            throw new IllegalStateException("Só é possível avaliar atendimentos concluídos");
        }

        // Verificar se já foi avaliado
        if (avaliacaoRepository.existsByAgendamentoId(dto.agendamentoId())) {
            throw new IllegalStateException("Este atendimento já foi avaliado");
        }

        return agendamento;
    }

    private void atualizarMedias(Avaliacao avaliacao) {
        // Em um sistema real, isso seria feito de forma assíncrona
        // ou via eventos para não impactar a performance
        if (avaliacao.getBarbearia() != null) {
            Double media = avaliacaoRepository.calcularMediaBarbearia(avaliacao.getBarbearia().getId());
            long total = avaliacaoRepository.countByBarbeariaIdAndVisivelTrue(avaliacao.getBarbearia().getId());
            // Atualizar barbearia.avaliacaoMedia e barbearia.totalAvaliacoes
            // barbeariaRepository.atualizarMedia(avaliacao.getBarbearia().getId(), media,
            // total);
        }
        if (avaliacao.getBarbeiro() != null) {
            Double media = avaliacaoRepository.calcularMediaBarbeiro(avaliacao.getBarbeiro().getId());
            long total = avaliacaoRepository.countByBarbeiroIdAndVisivelTrue(avaliacao.getBarbeiro().getId());
            // Atualizar barbeiro se tiver campos de média
        }
    }

    // ========== Responder Avaliação ==========

    /**
     * Responde a uma avaliação (admin/barbeiro).
     */
    @Transactional
    public AvaliacaoDTO responderAvaliacao(Long avaliacaoId, Long respondedorId, ResponderAvaliacaoDTO dto) {
        log.info("Respondendo avaliação {} por usuário {}", avaliacaoId, respondedorId);

        Avaliacao avaliacao = avaliacaoRepository.findById(avaliacaoId)
                .orElseThrow(() -> new EntityNotFoundException("Avaliação não encontrada"));

        // Verificar permissão (admin da barbearia ou barbeiro avaliado)
        boolean autorizado = false;
        if (avaliacao.getBarbearia() != null &&
                avaliacao.getBarbearia().getAdmin().getId().equals(respondedorId)) {
            autorizado = true;
        }
        if (avaliacao.getBarbeiro() != null &&
                avaliacao.getBarbeiro().getUsuario().getId().equals(respondedorId)) {
            autorizado = true;
        }

        if (!autorizado) {
            throw new IllegalArgumentException("Você não tem permissão para responder esta avaliação");
        }

        if (avaliacao.isRespondida()) {
            throw new IllegalStateException("Esta avaliação já foi respondida");
        }

        avaliacao.responder(dto.resposta());
        avaliacao = avaliacaoRepository.save(avaliacao);

        return AvaliacaoDTO.fromEntity(avaliacao);
    }

    // ========== Listar Avaliações ==========

    /**
     * Lista avaliações de uma barbearia.
     */
    @Transactional(readOnly = true)
    public Page<AvaliacaoDTO> listarAvaliacoesBarbearia(Long barbeariaId, Pageable pageable) {
        return avaliacaoRepository.findByBarbeariaIdAndVisivelTrue(barbeariaId, pageable)
                .map(AvaliacaoDTO::fromEntity);
    }

    /**
     * Lista avaliações de um barbeiro.
     */
    @Transactional(readOnly = true)
    public Page<AvaliacaoDTO> listarAvaliacoesBarbeiro(Long barbeiroId, Pageable pageable) {
        return avaliacaoRepository.findByBarbeiroIdAndVisivelTrue(barbeiroId, pageable)
                .map(AvaliacaoDTO::fromEntity);
    }

    /**
     * Lista avaliações feitas pelo cliente.
     */
    @Transactional(readOnly = true)
    public List<AvaliacaoDTO> listarMinhasAvaliacoes(Long clienteId) {
        return avaliacaoRepository.findByClienteId(clienteId)
                .stream()
                .map(AvaliacaoDTO::fromEntity)
                .toList();
    }

    /**
     * Lista últimas avaliações de uma barbearia (para exibição resumida).
     */
    @Transactional(readOnly = true)
    public List<AvaliacaoDTO> listarUltimasAvaliacoesBarbearia(Long barbeariaId) {
        return avaliacaoRepository.findUltimasAvaliacoesBarbearia(barbeariaId)
                .stream()
                .map(AvaliacaoDTO::fromEntity)
                .toList();
    }

    /**
     * Lista avaliações pendentes de resposta.
     */
    @Transactional(readOnly = true)
    public List<AvaliacaoDTO> listarPendentesResposta(Long barbeariaId) {
        return avaliacaoRepository.findPendentesRespostaBarbearia(barbeariaId)
                .stream()
                .map(AvaliacaoDTO::fromEntity)
                .toList();
    }

    // ========== Resumo de Avaliações ==========

    /**
     * Obtém resumo das avaliações de uma barbearia.
     */
    @Transactional(readOnly = true)
    public ResumoAvaliacoesDTO obterResumoBarbearia(Long barbeariaId) {
        Double media = avaliacaoRepository.calcularMediaBarbearia(barbeariaId);
        long total = avaliacaoRepository.countByBarbeariaIdAndVisivelTrue(barbeariaId);

        if (total == 0) {
            return ResumoAvaliacoesDTO.vazio();
        }

        Map<Integer, Long> distribuicao = new HashMap<>();
        distribuicao.put(5, 0L);
        distribuicao.put(4, 0L);
        distribuicao.put(3, 0L);
        distribuicao.put(2, 0L);
        distribuicao.put(1, 0L);

        avaliacaoRepository.distribuicaoNotasBarbearia(barbeariaId).forEach(row -> {
            Integer nota = (Integer) row[0];
            Long count = (Long) row[1];
            distribuicao.put(nota, count);
        });

        return new ResumoAvaliacoesDTO(media, total, distribuicao);
    }

    /**
     * Obtém resumo das avaliações de um barbeiro.
     */
    @Transactional(readOnly = true)
    public ResumoAvaliacoesDTO obterResumoBarbeiro(Long barbeiroId) {
        Double media = avaliacaoRepository.calcularMediaBarbeiro(barbeiroId);
        long total = avaliacaoRepository.countByBarbeiroIdAndVisivelTrue(barbeiroId);

        if (total == 0) {
            return ResumoAvaliacoesDTO.vazio();
        }

        // Por simplicidade, não calculamos distribuição para barbeiro
        return new ResumoAvaliacoesDTO(media, total, Map.of());
    }

    // ========== Verificações ==========

    /**
     * Verifica se agendamento já foi avaliado.
     */
    @Transactional(readOnly = true)
    public boolean agendamentoFoiAvaliado(Long agendamentoId) {
        return avaliacaoRepository.existsByAgendamentoId(agendamentoId);
    }

    /**
     * Busca avaliação de um agendamento.
     */
    @Transactional(readOnly = true)
    public AvaliacaoDTO buscarAvaliacaoAgendamento(Long agendamentoId) {
        return avaliacaoRepository.findByAgendamentoId(agendamentoId)
                .map(AvaliacaoDTO::fromEntity)
                .orElse(null);
    }
}
