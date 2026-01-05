package com.reguamaxima.orquestrador.aplicacao;

import com.reguamaxima.autenticacao.dominio.entidade.Usuario;
import com.reguamaxima.autenticacao.dominio.repository.UsuarioRepository;
import com.reguamaxima.orquestrador.dominio.dto.*;
import com.reguamaxima.orquestrador.dominio.entidade.Barbeiro;
import com.reguamaxima.orquestrador.dominio.entidade.Barbeiro.StatusVinculo;
import com.reguamaxima.orquestrador.dominio.entidade.Barbearia;
import com.reguamaxima.orquestrador.dominio.repository.BarbeiroRepository;
import com.reguamaxima.orquestrador.dominio.repository.BarbeariaRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Serviço de aplicação para gestão de barbeiros.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ServicoBarbeiro {

    private final BarbeiroRepository barbeiroRepository;
    private final BarbeariaRepository barbeariaRepository;
    private final UsuarioRepository usuarioRepository;

    // ========== Operações do Barbeiro ==========

    /**
     * Cria perfil de barbeiro para o usuário logado.
     * Se o usuário for dono de uma barbearia (ADMIN), automaticamente vincula
     * o perfil de barbeiro à sua própria barbearia como APROVADO.
     */
    @Transactional
    public BarbeiroDTO criarPerfil(Long usuarioId, CriarBarbeiroDTO dto) {
        log.info("Criando perfil de barbeiro para usuário: {}", usuarioId);

        if (barbeiroRepository.existsByUsuarioId(usuarioId)) {
            throw new IllegalStateException("Usuário já possui perfil de barbeiro");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        Barbeiro barbeiro = Barbeiro.builder()
                .usuario(usuario)
                .nomeProfissional(dto.nomeProfissional())
                .bio(dto.bio())
                .especialidades(dto.especialidades())
                .anosExperiencia(dto.anosExperiencia())
                .fotoUrl(dto.fotoUrl())
                .latitude(dto.latitude())
                .longitude(dto.longitude())
                .visivelMapa(dto.visivelMapa() != null ? dto.visivelMapa() : true)
                .telefone(dto.telefone())
                .whatsapp(dto.whatsapp())
                .instagram(dto.instagram())
                .build();

        // Se o usuário for dono de uma barbearia, vincula automaticamente como APROVADO
        barbeariaRepository.findByAdminId(usuarioId).ifPresent(barbearia -> {
            log.info("Usuário é dono da barbearia '{}', vinculando automaticamente como barbeiro", barbearia.getNome());
            barbeiro.setBarbearia(barbearia);
            barbeiro.setStatusVinculo(StatusVinculo.APROVADO);
        });

        barbeiro = barbeiroRepository.save(barbeiro);
        log.info("Perfil de barbeiro criado com ID: {}", barbeiro.getId());

        return BarbeiroDTO.fromEntity(barbeiro);
    }

    /**
     * Busca perfil do barbeiro pelo ID do usuário.
     */
    @Transactional(readOnly = true)
    public BarbeiroDTO buscarMeuPerfil(Long usuarioId) {
        Barbeiro barbeiro = barbeiroRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Perfil de barbeiro não encontrado"));

        return BarbeiroDTO.fromEntity(barbeiro);
    }

    /**
     * Atualiza perfil do barbeiro.
     */
    @Transactional
    public BarbeiroDTO atualizarPerfil(Long usuarioId, AtualizarBarbeiroDTO dto) {
        log.info("Atualizando perfil de barbeiro para usuário: {}", usuarioId);

        Barbeiro barbeiro = barbeiroRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Perfil de barbeiro não encontrado"));

        if (dto.nomeProfissional() != null) {
            barbeiro.setNomeProfissional(dto.nomeProfissional());
        }
        if (dto.bio() != null) {
            barbeiro.setBio(dto.bio());
        }
        if (dto.especialidades() != null) {
            barbeiro.setEspecialidades(dto.especialidades());
        }
        if (dto.anosExperiencia() != null) {
            barbeiro.setAnosExperiencia(dto.anosExperiencia());
        }
        if (dto.fotoUrl() != null) {
            barbeiro.setFotoUrl(dto.fotoUrl());
        }
        if (dto.portfolioUrls() != null) {
            barbeiro.setPortfolioUrls(dto.portfolioUrls());
        }
        if (dto.latitude() != null) {
            barbeiro.setLatitude(dto.latitude());
        }
        if (dto.longitude() != null) {
            barbeiro.setLongitude(dto.longitude());
        }
        if (dto.visivelMapa() != null) {
            barbeiro.setVisivelMapa(dto.visivelMapa());
        }
        if (dto.telefone() != null) {
            barbeiro.setTelefone(dto.telefone());
        }
        if (dto.whatsapp() != null) {
            barbeiro.setWhatsapp(dto.whatsapp());
        }
        if (dto.instagram() != null) {
            barbeiro.setInstagram(dto.instagram());
        }

        barbeiro = barbeiroRepository.save(barbeiro);
        return BarbeiroDTO.fromEntity(barbeiro);
    }

    // ========== Vínculo com Barbearia ==========

    /**
     * Barbeiro solicita vínculo com uma barbearia.
     */
    @Transactional
    public BarbeiroDTO solicitarVinculo(Long usuarioId, Long barbeariaId) {
        log.info("Barbeiro {} solicitando vínculo com barbearia {}", usuarioId, barbeariaId);

        Barbeiro barbeiro = barbeiroRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Perfil de barbeiro não encontrado"));

        Barbearia barbearia = barbeariaRepository.findById(barbeariaId)
                .orElseThrow(() -> new EntityNotFoundException("Barbearia não encontrada"));

        barbeiro.solicitarVinculo(barbearia);
        barbeiro = barbeiroRepository.save(barbeiro);

        log.info("Solicitação de vínculo criada");
        return BarbeiroDTO.fromEntity(barbeiro);
    }

    /**
     * Barbeiro cancela solicitação de vínculo pendente.
     */
    @Transactional
    public BarbeiroDTO cancelarSolicitacao(Long usuarioId) {
        log.info("Cancelando solicitação de vínculo do barbeiro {}", usuarioId);

        Barbeiro barbeiro = barbeiroRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Perfil de barbeiro não encontrado"));

        barbeiro.cancelarSolicitacao();
        barbeiro = barbeiroRepository.save(barbeiro);

        return BarbeiroDTO.fromEntity(barbeiro);
    }

    /**
     * Barbeiro se desvincula da barbearia atual.
     */
    @Transactional
    public BarbeiroDTO desvincular(Long usuarioId) {
        log.info("Barbeiro {} se desvinculando", usuarioId);

        Barbeiro barbeiro = barbeiroRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Perfil de barbeiro não encontrado"));

        barbeiro.desvincular();
        barbeiro = barbeiroRepository.save(barbeiro);

        return BarbeiroDTO.fromEntity(barbeiro);
    }

    // ========== Operações do Admin ==========

    /**
     * Admin busca solicitações pendentes de sua barbearia.
     */
    @Transactional(readOnly = true)
    public List<BarbeiroResumoDTO> buscarSolicitacoesPendentes(Long adminId) {
        Barbearia barbearia = barbeariaRepository.findByAdminId(adminId)
                .orElseThrow(() -> new EntityNotFoundException("Barbearia não encontrada"));

        return barbeiroRepository.findSolicitacoesPendentes(barbearia.getId())
                .stream()
                .map(BarbeiroResumoDTO::fromEntity)
                .toList();
    }

    /**
     * Admin aprova solicitação de vínculo.
     */
    @Transactional
    public BarbeiroDTO aprovarVinculo(Long adminId, Long barbeiroId) {
        log.info("Admin {} aprovando vínculo do barbeiro {}", adminId, barbeiroId);

        Barbearia barbearia = barbeariaRepository.findByAdminId(adminId)
                .orElseThrow(() -> new EntityNotFoundException("Barbearia não encontrada"));

        Barbeiro barbeiro = barbeiroRepository.findById(barbeiroId)
                .orElseThrow(() -> new EntityNotFoundException("Barbeiro não encontrado"));

        // Verifica se a solicitação é para esta barbearia
        if (barbeiro.getBarbearia() == null || !barbeiro.getBarbearia().getId().equals(barbearia.getId())) {
            throw new IllegalStateException("Barbeiro não solicitou vínculo com esta barbearia");
        }

        barbeiro.aprovarVinculo();
        barbeiro = barbeiroRepository.save(barbeiro);

        log.info("Vínculo aprovado");
        return BarbeiroDTO.fromEntity(barbeiro);
    }

    /**
     * Admin rejeita solicitação de vínculo.
     */
    @Transactional
    public BarbeiroDTO rejeitarVinculo(Long adminId, Long barbeiroId) {
        log.info("Admin {} rejeitando vínculo do barbeiro {}", adminId, barbeiroId);

        Barbearia barbearia = barbeariaRepository.findByAdminId(adminId)
                .orElseThrow(() -> new EntityNotFoundException("Barbearia não encontrada"));

        Barbeiro barbeiro = barbeiroRepository.findById(barbeiroId)
                .orElseThrow(() -> new EntityNotFoundException("Barbeiro não encontrado"));

        // Verifica se a solicitação é para esta barbearia
        if (barbeiro.getBarbearia() == null || !barbeiro.getBarbearia().getId().equals(barbearia.getId())) {
            throw new IllegalStateException("Barbeiro não solicitou vínculo com esta barbearia");
        }

        barbeiro.rejeitarVinculo();
        barbeiro = barbeiroRepository.save(barbeiro);

        log.info("Vínculo rejeitado");
        return BarbeiroDTO.fromEntity(barbeiro);
    }

    /**
     * Admin desvincula um barbeiro de sua barbearia.
     */
    @Transactional
    public void desvincularBarbeiro(Long adminId, Long barbeiroId) {
        log.info("Admin {} desvinculando barbeiro {}", adminId, barbeiroId);

        Barbearia barbearia = barbeariaRepository.findByAdminId(adminId)
                .orElseThrow(() -> new EntityNotFoundException("Barbearia não encontrada"));

        Barbeiro barbeiro = barbeiroRepository.findById(barbeiroId)
                .orElseThrow(() -> new EntityNotFoundException("Barbeiro não encontrado"));

        // Verifica se barbeiro está vinculado a esta barbearia
        if (barbeiro.getBarbearia() == null || !barbeiro.getBarbearia().getId().equals(barbearia.getId())) {
            throw new IllegalStateException("Barbeiro não está vinculado a esta barbearia");
        }

        barbeiro.desvincular();
        barbeiroRepository.save(barbeiro);

        log.info("Barbeiro desvinculado");
    }

    /**
     * Admin lista barbeiros de sua barbearia.
     */
    @Transactional(readOnly = true)
    public List<BarbeiroResumoDTO> listarBarbeirosDaBarbearia(Long adminId) {
        Barbearia barbearia = barbeariaRepository.findByAdminId(adminId)
                .orElseThrow(() -> new EntityNotFoundException("Barbearia não encontrada"));

        return barbeiroRepository.findBarbeirosDaBarbearia(barbearia.getId())
                .stream()
                .map(BarbeiroResumoDTO::fromEntity)
                .toList();
    }

    // ========== Consultas Públicas ==========

    /**
     * Busca barbeiro por ID (público).
     */
    @Transactional(readOnly = true)
    public BarbeiroDTO buscarPorId(Long id) {
        Barbeiro barbeiro = barbeiroRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Barbeiro não encontrado"));

        return BarbeiroDTO.fromEntity(barbeiro);
    }

    /**
     * Busca barbeiros próximos por geolocalização.
     */
    @Transactional(readOnly = true)
    public List<BarbeiroResumoDTO> buscarProximos(Double latitude, Double longitude, Double raioKm) {
        return barbeiroRepository.findBarbeirosProximos(latitude, longitude, raioKm)
                .stream()
                .map(BarbeiroResumoDTO::fromEntity)
                .toList();
    }

    /**
     * Busca barbeiros por termo (nome ou especialidade).
     */
    @Transactional(readOnly = true)
    public Page<BarbeiroResumoDTO> buscarPorTermo(String termo, Pageable pageable) {
        return barbeiroRepository.buscarPorTermo(termo, pageable)
                .map(BarbeiroResumoDTO::fromEntity);
    }

    /**
     * Lista barbeiros de uma barbearia específica (público).
     */
    @Transactional(readOnly = true)
    public List<BarbeiroResumoDTO> listarBarbeirosDaBarbearia(Long barbeariaId, boolean apenasAtivos) {
        List<Barbeiro> barbeiros;

        if (apenasAtivos) {
            barbeiros = barbeiroRepository.findBarbeirosDaBarbearia(barbeariaId);
        } else {
            barbeiros = barbeiroRepository.findByBarbeariaIdAndStatusVinculo(barbeariaId, StatusVinculo.APROVADO);
        }

        return barbeiros.stream()
                .map(BarbeiroResumoDTO::fromEntity)
                .toList();
    }

    /**
     * Verifica se usuário possui perfil de barbeiro.
     */
    @Transactional(readOnly = true)
    public boolean possuiPerfil(Long usuarioId) {
        return barbeiroRepository.existsByUsuarioId(usuarioId);
    }
}
