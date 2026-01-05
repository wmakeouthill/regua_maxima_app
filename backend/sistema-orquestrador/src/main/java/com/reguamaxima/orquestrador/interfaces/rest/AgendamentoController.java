package com.reguamaxima.orquestrador.interfaces.rest;

import com.reguamaxima.kernel.exception.RecursoNaoEncontradoException;
import com.reguamaxima.kernel.security.CustomUserDetails;
import com.reguamaxima.orquestrador.aplicacao.ServicoAgendamento;
import com.reguamaxima.orquestrador.dominio.dto.*;
import com.reguamaxima.orquestrador.dominio.repository.BarbeiroRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Controller REST para gerenciamento de Agendamentos.
 */
@RestController
@RequestMapping("/api/v1/agendamentos")
@RequiredArgsConstructor
@Tag(name = "Agendamentos", description = "Endpoints para gerenciamento de agendamentos")
public class AgendamentoController {

    private final ServicoAgendamento servicoAgendamento;
    private final BarbeiroRepository barbeiroRepository;

    // ========== Endpoints do Cliente ==========

    @PostMapping
    @PreAuthorize("hasRole('CLIENTE')")
    @Operation(summary = "Criar agendamento", description = "Cria um novo agendamento para o cliente logado")
    public ResponseEntity<AgendamentoDTO> criarAgendamento(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CriarAgendamentoDTO dto) {
        AgendamentoDTO agendamento = servicoAgendamento.criarAgendamento(userDetails.getId(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(agendamento);
    }

    @GetMapping("/meus")
    @PreAuthorize("hasRole('CLIENTE')")
    @Operation(summary = "Meus próximos agendamentos", description = "Lista próximos agendamentos do cliente")
    public ResponseEntity<List<AgendamentoDTO>> meusProximosAgendamentos(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(servicoAgendamento.buscarProximosAgendamentosCliente(userDetails.getId()));
    }

    @GetMapping("/meus/historico")
    @PreAuthorize("hasRole('CLIENTE')")
    @Operation(summary = "Histórico de agendamentos", description = "Lista histórico de agendamentos do cliente")
    public ResponseEntity<Page<AgendamentoDTO>> meuHistorico(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            Pageable pageable) {
        return ResponseEntity.ok(servicoAgendamento.buscarHistoricoCliente(userDetails.getId(), pageable));
    }

    @PostMapping("/{id}/cancelar")
    @PreAuthorize("hasRole('CLIENTE')")
    @Operation(summary = "Cancelar agendamento", description = "Cancela um agendamento do cliente")
    public ResponseEntity<AgendamentoDTO> cancelarAgendamento(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestBody(required = false) CancelarAgendamentoDTO dto) {
        return ResponseEntity.ok(servicoAgendamento.cancelarPeloCliente(id, userDetails.getId(), dto));
    }

    // ========== Endpoints do Barbeiro ==========

    @GetMapping("/barbeiro/agenda")
    @PreAuthorize("hasRole('BARBEIRO')")
    @Operation(summary = "Agenda do dia", description = "Lista agendamentos do barbeiro para uma data")
    public ResponseEntity<List<AgendamentoDTO>> agendaDia(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        Long barbeiroId = getBarbeiroIdFromUser(userDetails.getId());
        LocalDate dataConsulta = data != null ? data : LocalDate.now();
        return ResponseEntity.ok(servicoAgendamento.buscarAgendaDia(barbeiroId, dataConsulta));
    }

    @GetMapping("/barbeiro/proximos")
    @PreAuthorize("hasRole('BARBEIRO')")
    @Operation(summary = "Próximos agendamentos", description = "Lista próximos agendamentos do barbeiro")
    public ResponseEntity<List<AgendamentoDTO>> proximosAgendamentosBarbeiro(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity
                .ok(servicoAgendamento.buscarProximosAgendamentosBarbeiro(getBarbeiroIdFromUser(userDetails.getId())));
    }

    @GetMapping("/barbeiro/pendentes")
    @PreAuthorize("hasRole('BARBEIRO')")
    @Operation(summary = "Agendamentos pendentes", description = "Lista agendamentos aguardando confirmação")
    public ResponseEntity<List<AgendamentoDTO>> agendamentosPendentes(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity
                .ok(servicoAgendamento.buscarPendentesConfirmacao(getBarbeiroIdFromUser(userDetails.getId())));
    }

    @PostMapping("/{id}/confirmar")
    @PreAuthorize("hasRole('BARBEIRO')")
    @Operation(summary = "Confirmar agendamento", description = "Confirma um agendamento pendente")
    public ResponseEntity<AgendamentoDTO> confirmarAgendamento(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity
                .ok(servicoAgendamento.confirmarAgendamento(id, getBarbeiroIdFromUser(userDetails.getId())));
    }

    @PostMapping("/{id}/iniciar")
    @PreAuthorize("hasRole('BARBEIRO')")
    @Operation(summary = "Iniciar atendimento", description = "Inicia o atendimento de um agendamento")
    public ResponseEntity<AgendamentoDTO> iniciarAtendimento(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(servicoAgendamento.iniciarAtendimento(id, getBarbeiroIdFromUser(userDetails.getId())));
    }

    @PostMapping("/{id}/concluir")
    @PreAuthorize("hasRole('BARBEIRO')")
    @Operation(summary = "Concluir agendamento", description = "Marca o agendamento como concluído")
    public ResponseEntity<AgendamentoDTO> concluirAgendamento(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity
                .ok(servicoAgendamento.concluirAgendamento(id, getBarbeiroIdFromUser(userDetails.getId())));
    }

    @PostMapping("/{id}/nao-compareceu")
    @PreAuthorize("hasRole('BARBEIRO')")
    @Operation(summary = "Marcar não compareceu", description = "Marca que o cliente não compareceu")
    public ResponseEntity<AgendamentoDTO> marcarNaoCompareceu(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity
                .ok(servicoAgendamento.marcarNaoCompareceu(id, getBarbeiroIdFromUser(userDetails.getId())));
    }

    @PostMapping("/{id}/cancelar-barbeiro")
    @PreAuthorize("hasRole('BARBEIRO')")
    @Operation(summary = "Cancelar pelo barbeiro", description = "Cancela um agendamento pelo barbeiro")
    public ResponseEntity<AgendamentoDTO> cancelarPeloBarbeiro(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestBody(required = false) CancelarAgendamentoDTO dto) {
        return ResponseEntity
                .ok(servicoAgendamento.cancelarPeloBarbeiro(id, getBarbeiroIdFromUser(userDetails.getId()), dto));
    }

    // ========== Endpoints de Disponibilidade (Público) ==========

    @GetMapping("/disponibilidade")
    @Operation(summary = "Horários disponíveis", description = "Lista horários disponíveis para agendamento")
    public ResponseEntity<List<HorarioDisponivelDTO>> horariosDisponiveis(
            @RequestParam Long barbeiroId,
            @RequestParam Long servicoId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return ResponseEntity.ok(servicoAgendamento.buscarHorariosDisponiveis(barbeiroId, servicoId, data));
    }

    // ========== Endpoint de Consulta ==========

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Buscar agendamento", description = "Busca um agendamento por ID")
    public ResponseEntity<AgendamentoDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(servicoAgendamento.buscarPorId(id));
    }

    // ========== Métodos Auxiliares ==========

    /**
     * Busca o ID do barbeiro a partir do ID do usuário.
     */
    private Long getBarbeiroIdFromUser(Long usuarioId) {
        return barbeiroRepository.findByUsuarioId(usuarioId)
                .map(barbeiro -> barbeiro.getId())
                .orElseThrow(
                        () -> new RecursoNaoEncontradoException("Perfil de barbeiro não encontrado para este usuário"));
    }
}
