package com.reguamaxima.orquestrador.aplicacao;

import com.reguamaxima.autenticacao.dominio.entidade.Usuario;
import com.reguamaxima.autenticacao.dominio.repository.UsuarioRepository;
import com.reguamaxima.orquestrador.dominio.dto.*;
import com.reguamaxima.orquestrador.dominio.entidade.Barbearia;
import com.reguamaxima.orquestrador.dominio.entidade.SessaoTrabalho;
import com.reguamaxima.orquestrador.dominio.enums.StatusSessao;
import com.reguamaxima.orquestrador.dominio.repository.BarbeariaRepository;
import com.reguamaxima.orquestrador.dominio.repository.SessaoTrabalhoRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Serviço de aplicação para gestão de sessões de trabalho/caixa.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ServicoSessaoTrabalho {

    private final SessaoTrabalhoRepository sessaoRepository;
    private final BarbeariaRepository barbeariaRepository;
    private final UsuarioRepository usuarioRepository;

    // ========== Operações de Sessão ==========

    /**
     * Abre uma nova sessão de trabalho.
     */
    @Transactional
    public SessaoTrabalhoDTO abrirSessao(Long usuarioId, AbrirSessaoDTO dto) {
        log.info("Abrindo sessão para barbearia {} - usuário: {}", dto.barbeariaId(), usuarioId);

        // Verificar se já existe sessão ativa
        if (sessaoRepository.existsSessaoAtiva(dto.barbeariaId())) {
            throw new IllegalStateException("Já existe uma sessão ativa para esta barbearia");
        }

        Barbearia barbearia = barbeariaRepository.findById(dto.barbeariaId())
                .orElseThrow(() -> new EntityNotFoundException("Barbearia não encontrada"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        // Obter próximo número de sessão
        Integer numeroSessao = sessaoRepository.getProximoNumeroSessao(
                dto.barbeariaId(), LocalDate.now());

        SessaoTrabalho sessao = SessaoTrabalho.builder()
                .numeroSessao(numeroSessao)
                .barbearia(barbearia)
                .usuario(usuario)
                .valorAbertura(dto.valorAbertura())
                .observacoes(dto.observacoes())
                .build();

        sessao = sessaoRepository.save(sessao);
        log.info("Sessão {} aberta com sucesso - ID: {}", numeroSessao, sessao.getId());

        return SessaoTrabalhoDTO.fromEntity(sessao);
    }

    /**
     * Pausa a sessão ativa.
     */
    @Transactional
    public SessaoTrabalhoDTO pausarSessao(Long barbeariaId) {
        log.info("Pausando sessão da barbearia {}", barbeariaId);

        SessaoTrabalho sessao = sessaoRepository.findSessaoAtiva(barbeariaId)
                .orElseThrow(() -> new IllegalStateException("Não há sessão ativa para pausar"));

        sessao.pausar();
        sessao = sessaoRepository.save(sessao);

        log.info("Sessão {} pausada", sessao.getId());
        return SessaoTrabalhoDTO.fromEntity(sessao);
    }

    /**
     * Retoma uma sessão pausada.
     */
    @Transactional
    public SessaoTrabalhoDTO retomarSessao(Long barbeariaId) {
        log.info("Retomando sessão da barbearia {}", barbeariaId);

        SessaoTrabalho sessao = sessaoRepository.findSessaoAtiva(barbeariaId)
                .orElseThrow(() -> new IllegalStateException("Não há sessão para retomar"));

        sessao.retomar();
        sessao = sessaoRepository.save(sessao);

        log.info("Sessão {} retomada", sessao.getId());
        return SessaoTrabalhoDTO.fromEntity(sessao);
    }

    /**
     * Fecha a sessão ativa.
     */
    @Transactional
    public SessaoTrabalhoDTO fecharSessao(Long barbeariaId, FecharSessaoDTO dto) {
        log.info("Fechando sessão da barbearia {}", barbeariaId);

        SessaoTrabalho sessao = sessaoRepository.findSessaoAtiva(barbeariaId)
                .orElseThrow(() -> new IllegalStateException("Não há sessão ativa para fechar"));

        sessao.finalizar(dto.valorFechamento());
        if (dto.observacoes() != null && !dto.observacoes().isBlank()) {
            sessao.setObservacoes(
                    (sessao.getObservacoes() != null ? sessao.getObservacoes() + " | " : "")
                            + dto.observacoes());
        }

        sessao = sessaoRepository.save(sessao);

        log.info("Sessão {} fechada - Valor esperado: {}, Valor real: {}, Diferença: {}",
                sessao.getId(),
                sessao.getValorEsperado(),
                dto.valorFechamento(),
                sessao.getDiferencaCaixa());

        return SessaoTrabalhoDTO.fromEntity(sessao);
    }

    // ========== Consultas ==========

    /**
     * Busca a sessão ativa da barbearia.
     */
    @Transactional(readOnly = true)
    public Optional<SessaoTrabalhoDTO> buscarSessaoAtiva(Long barbeariaId) {
        return sessaoRepository.findSessaoAtiva(barbeariaId)
                .map(SessaoTrabalhoDTO::fromEntity);
    }

    /**
     * Busca histórico de sessões da barbearia.
     */
    @Transactional(readOnly = true)
    public List<SessaoTrabalhoDTO> buscarHistorico(Long barbeariaId, int limite) {
        return sessaoRepository.findHistoricoLimitado(barbeariaId, limite)
                .stream()
                .map(SessaoTrabalhoDTO::fromEntity)
                .toList();
    }

    /**
     * Busca sessões por data.
     */
    @Transactional(readOnly = true)
    public List<SessaoTrabalhoDTO> buscarPorData(Long barbeariaId, LocalDate data) {
        return sessaoRepository.findByBarbeariaIdAndData(barbeariaId, data)
                .stream()
                .map(SessaoTrabalhoDTO::fromEntity)
                .toList();
    }

    // ========== Status Público para Clientes ==========

    /**
     * Verifica se a barbearia está aberta (para clientes).
     */
    @Transactional(readOnly = true)
    public StatusBarbeariaDTO verificarStatusBarbearia(Long barbeariaId) {
        Barbearia barbearia = barbeariaRepository.findById(barbeariaId)
                .orElseThrow(() -> new EntityNotFoundException("Barbearia não encontrada"));

        Optional<SessaoTrabalho> sessaoAtiva = sessaoRepository.findSessaoAtiva(barbeariaId);

        if (sessaoAtiva.isEmpty()) {
            return StatusBarbeariaDTO.fechada(barbeariaId, barbearia.getNome());
        }

        SessaoTrabalho sessao = sessaoAtiva.get();
        if (sessao.getStatus() == StatusSessao.ABERTA) {
            return StatusBarbeariaDTO.aberta(barbeariaId, barbearia.getNome());
        } else if (sessao.getStatus() == StatusSessao.PAUSADA) {
            return StatusBarbeariaDTO.pausada(barbeariaId, barbearia.getNome());
        } else {
            return StatusBarbeariaDTO.fechada(barbeariaId, barbearia.getNome());
        }
    }

    /**
     * Verifica se barbearia está aberta (retorno simples).
     */
    @Transactional(readOnly = true)
    public boolean isBarbeariaAberta(Long barbeariaId) {
        return sessaoRepository.isBarbeariaAberta(barbeariaId);
    }
}
