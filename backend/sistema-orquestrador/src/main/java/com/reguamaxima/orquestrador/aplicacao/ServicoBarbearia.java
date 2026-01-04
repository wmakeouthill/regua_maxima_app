package com.reguamaxima.orquestrador.aplicacao;

import com.reguamaxima.autenticacao.dominio.entidade.Usuario;
import com.reguamaxima.autenticacao.dominio.repository.UsuarioRepository;
import com.reguamaxima.orquestrador.dominio.dto.*;
import com.reguamaxima.orquestrador.dominio.entidade.Barbearia;
import com.reguamaxima.orquestrador.dominio.entidade.Servico;
import com.reguamaxima.orquestrador.dominio.repository.BarbeariaRepository;
import com.reguamaxima.orquestrador.dominio.repository.ServicoRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Serviço de aplicação para gestão de barbearias.
 */
@Service
@Transactional
public class ServicoBarbearia {

    private final BarbeariaRepository barbeariaRepository;
    private final ServicoRepository servicoRepository;
    private final UsuarioRepository usuarioRepository;

    public ServicoBarbearia(
            BarbeariaRepository barbeariaRepository,
            ServicoRepository servicoRepository,
            UsuarioRepository usuarioRepository) {
        this.barbeariaRepository = barbeariaRepository;
        this.servicoRepository = servicoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    // ==================== OPERAÇÕES DE ADMIN ====================

    /**
     * Cria uma nova barbearia vinculada ao admin.
     */
    public BarbeariaDTO criar(Long adminId, CriarBarbeariaDTO dto) {
        // Verifica se o admin existe
        Usuario admin = usuarioRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário admin não encontrado"));

        // Verifica se o admin já tem uma barbearia
        if (barbeariaRepository.existsByAdminId(adminId)) {
            throw new IllegalStateException("Este administrador já possui uma barbearia cadastrada");
        }

        // Verifica se o admin tem role correto
        if (admin.getRole() != Usuario.Role.ADMIN) {
            throw new IllegalArgumentException("Apenas administradores podem criar barbearias");
        }

        // Cria a barbearia
        Barbearia barbearia = new Barbearia();
        barbearia.setNome(dto.nome());
        barbearia.setDescricao(dto.descricao());
        barbearia.setEndereco(dto.endereco());
        barbearia.setCidade(dto.cidade());
        barbearia.setEstado(dto.estado());
        barbearia.setCep(dto.cep());
        barbearia.setLatitude(dto.latitude());
        barbearia.setLongitude(dto.longitude());
        barbearia.setTelefone(dto.telefone());
        barbearia.setWhatsapp(dto.whatsapp());
        barbearia.setEmail(dto.email());
        barbearia.setInstagram(dto.instagram());
        barbearia.setAdmin(admin);
        barbearia.setAtivo(true);

        // Gera slug e aplica tema padrão
        barbearia.gerarSlug();
        barbearia.setTemaConfig(BarbeariaTemaDTO.padrao().toJson());

        // Garante slug único
        String slugBase = barbearia.getSlug();
        int contador = 1;
        while (barbeariaRepository.existsBySlug(barbearia.getSlug())) {
            barbearia.setSlug(slugBase + "-" + contador++);
        }

        Barbearia salva = barbeariaRepository.save(barbearia);
        return BarbeariaDTO.fromEntity(salva);
    }

    /**
     * Atualiza dados da barbearia do admin.
     */
    public BarbeariaDTO atualizar(Long adminId, AtualizarBarbeariaDTO dto) {
        Barbearia barbearia = buscarBarbeariaDoAdmin(adminId);

        if (dto.nome() != null)
            barbearia.setNome(dto.nome());
        if (dto.descricao() != null)
            barbearia.setDescricao(dto.descricao());
        if (dto.endereco() != null)
            barbearia.setEndereco(dto.endereco());
        if (dto.cidade() != null)
            barbearia.setCidade(dto.cidade());
        if (dto.estado() != null)
            barbearia.setEstado(dto.estado());
        if (dto.cep() != null)
            barbearia.setCep(dto.cep());
        if (dto.latitude() != null)
            barbearia.setLatitude(dto.latitude());
        if (dto.longitude() != null)
            barbearia.setLongitude(dto.longitude());
        if (dto.telefone() != null)
            barbearia.setTelefone(dto.telefone());
        if (dto.whatsapp() != null)
            barbearia.setWhatsapp(dto.whatsapp());
        if (dto.email() != null)
            barbearia.setEmail(dto.email());
        if (dto.instagram() != null)
            barbearia.setInstagram(dto.instagram());
        if (dto.fotoUrl() != null)
            barbearia.setFotoUrl(dto.fotoUrl());
        if (dto.bannerUrl() != null)
            barbearia.setBannerUrl(dto.bannerUrl());
        if (dto.logoUrl() != null)
            barbearia.setLogoUrl(dto.logoUrl());

        Barbearia salva = barbeariaRepository.save(barbearia);
        return BarbeariaDTO.fromEntity(salva, listarServicosDTO(salva.getId()));
    }

    /**
     * Atualiza tema da barbearia.
     */
    public BarbeariaDTO atualizarTema(Long adminId, BarbeariaTemaDTO tema) {
        Barbearia barbearia = buscarBarbeariaDoAdmin(adminId);
        barbearia.setTemaConfig(tema.toJson());

        Barbearia salva = barbeariaRepository.save(barbearia);
        return BarbeariaDTO.fromEntity(salva);
    }

    /**
     * Busca a barbearia do admin.
     */
    @Transactional(readOnly = true)
    public BarbeariaDTO buscarMinhaBarbearia(Long adminId) {
        Barbearia barbearia = buscarBarbeariaDoAdmin(adminId);
        return BarbeariaDTO.fromEntity(barbearia, listarServicosDTO(barbearia.getId()));
    }

    /**
     * Desativa a barbearia (soft delete).
     */
    public void desativar(Long adminId) {
        Barbearia barbearia = buscarBarbeariaDoAdmin(adminId);
        barbearia.setAtivo(false);
        barbeariaRepository.save(barbearia);
    }

    /**
     * Ativa a barbearia.
     */
    public void ativar(Long adminId) {
        Barbearia barbearia = barbeariaRepository.findByAdminIdAndAtivoTrue(adminId)
                .orElseGet(() -> barbeariaRepository.findByAdminId(adminId)
                        .orElseThrow(() -> new IllegalArgumentException("Barbearia não encontrada")));
        barbearia.setAtivo(true);
        barbeariaRepository.save(barbearia);
    }

    // ==================== OPERAÇÕES PÚBLICAS ====================

    /**
     * Busca barbearia por slug (para clientes).
     */
    @Transactional(readOnly = true)
    public BarbeariaDTO buscarPorSlug(String slug) {
        Barbearia barbearia = barbeariaRepository.findBySlugAndAtivoTrue(slug)
                .orElseThrow(() -> new IllegalArgumentException("Barbearia não encontrada"));
        return BarbeariaDTO.fromEntity(barbearia, listarServicosDTO(barbearia.getId()));
    }

    /**
     * Busca barbearia por ID.
     */
    @Transactional(readOnly = true)
    public BarbeariaDTO buscarPorId(Long id) {
        Barbearia barbearia = barbeariaRepository.findById(id)
                .filter(Barbearia::getAtivo)
                .orElseThrow(() -> new IllegalArgumentException("Barbearia não encontrada"));
        return BarbeariaDTO.fromEntity(barbearia, listarServicosDTO(barbearia.getId()));
    }

    /**
     * Lista barbearias ativas com paginação.
     */
    @Transactional(readOnly = true)
    public Page<BarbeariaResumoDTO> listar(Pageable pageable) {
        return barbeariaRepository.findByAtivoTrue(pageable)
                .map(BarbeariaResumoDTO::fromEntity);
    }

    /**
     * Busca barbearias por nome.
     */
    @Transactional(readOnly = true)
    public Page<BarbeariaResumoDTO> buscarPorNome(String nome, Pageable pageable) {
        return barbeariaRepository.buscarPorNome(nome, pageable)
                .map(BarbeariaResumoDTO::fromEntity);
    }

    /**
     * Busca barbearias por cidade.
     */
    @Transactional(readOnly = true)
    public Page<BarbeariaResumoDTO> buscarPorCidade(String cidade, Pageable pageable) {
        return barbeariaRepository.findByCidade(cidade, pageable)
                .map(BarbeariaResumoDTO::fromEntity);
    }

    /**
     * Busca barbearias próximas por geolocalização.
     */
    @Transactional(readOnly = true)
    public List<BarbeariaResumoDTO> buscarProximas(Double latitude, Double longitude, Double raioKm) {
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("Latitude e longitude são obrigatórios");
        }

        double raio = raioKm != null ? raioKm : 10.0; // Padrão: 10km

        return barbeariaRepository.findProximas(latitude, longitude, raio)
                .stream()
                .map(result -> {
                    Barbearia b = (Barbearia) result[0];
                    Double distancia = (Double) result[1];
                    return BarbeariaResumoDTO.fromEntity(b, distancia);
                })
                .toList();
    }

    // ==================== MÉTODOS AUXILIARES ====================

    private Barbearia buscarBarbeariaDoAdmin(Long adminId) {
        return barbeariaRepository.findByAdminIdAndAtivoTrue(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Barbearia não encontrada para este administrador"));
    }

    private Barbearia buscarBarbeariaDoAdminIncluindoInativos(Long adminId) {
        return barbeariaRepository.findByAdminId(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Barbearia não encontrada para este administrador"));
    }

    private List<ServicoDTO> listarServicosDTO(Long barbeariaId) {
        return servicoRepository.findByBarbeariaIdAndAtivoTrueOrderByOrdemExibicaoAsc(barbeariaId)
                .stream()
                .map(ServicoDTO::fromEntity)
                .toList();
    }

    // ==================== OPERAÇÕES DE SERVIÇOS ====================

    /**
     * Adiciona serviço à barbearia.
     */
    public ServicoDTO adicionarServico(Long adminId, CriarServicoDTO dto) {
        Barbearia barbearia = buscarBarbeariaDoAdmin(adminId);

        // Verifica se já existe serviço com mesmo nome
        if (servicoRepository.existsByBarbeariaIdAndNomeIgnoreCase(barbearia.getId(), dto.nome())) {
            throw new IllegalStateException("Já existe um serviço com este nome");
        }

        Servico servico = new Servico();
        servico.setNome(dto.nome());
        servico.setDescricao(dto.descricao());
        servico.setDuracaoMinutos(dto.duracaoMinutos());
        servico.setPreco(dto.preco());
        servico.setIcone(dto.icone() != null ? dto.icone() : "cut-outline");
        servico.setOrdemExibicao(dto.ordemExibicao() != null ? dto.ordemExibicao() : 0);
        servico.setBarbearia(barbearia);
        servico.setAtivo(true);

        Servico salvo = servicoRepository.save(servico);
        return ServicoDTO.fromEntity(salvo);
    }

    /**
     * Atualiza serviço da barbearia.
     */
    public ServicoDTO atualizarServico(Long adminId, Long servicoId, AtualizarServicoDTO dto) {
        Barbearia barbearia = buscarBarbeariaDoAdmin(adminId);

        Servico servico = servicoRepository.findById(servicoId)
                .filter(s -> s.getBarbearia().getId().equals(barbearia.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Serviço não encontrado"));

        if (dto.nome() != null) {
            // Verifica duplicidade se mudou o nome
            if (!servico.getNome().equalsIgnoreCase(dto.nome()) &&
                    servicoRepository.existsByBarbeariaIdAndNomeIgnoreCase(barbearia.getId(), dto.nome())) {
                throw new IllegalStateException("Já existe um serviço com este nome");
            }
            servico.setNome(dto.nome());
        }
        if (dto.descricao() != null)
            servico.setDescricao(dto.descricao());
        if (dto.duracaoMinutos() != null)
            servico.setDuracaoMinutos(dto.duracaoMinutos());
        if (dto.preco() != null)
            servico.setPreco(dto.preco());
        if (dto.icone() != null)
            servico.setIcone(dto.icone());
        if (dto.ordemExibicao() != null)
            servico.setOrdemExibicao(dto.ordemExibicao());
        if (dto.ativo() != null)
            servico.setAtivo(dto.ativo());

        Servico salvo = servicoRepository.save(servico);
        return ServicoDTO.fromEntity(salvo);
    }

    /**
     * Remove serviço da barbearia (soft delete).
     */
    public void removerServico(Long adminId, Long servicoId) {
        Barbearia barbearia = buscarBarbeariaDoAdmin(adminId);

        Servico servico = servicoRepository.findById(servicoId)
                .filter(s -> s.getBarbearia().getId().equals(barbearia.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Serviço não encontrado"));

        servico.setAtivo(false);
        servicoRepository.save(servico);
    }

    /**
     * Lista serviços da barbearia do admin.
     */
    @Transactional(readOnly = true)
    public List<ServicoDTO> listarMeusServicos(Long adminId) {
        Barbearia barbearia = buscarBarbeariaDoAdmin(adminId);
        return listarServicosDTO(barbearia.getId());
    }

    /**
     * Lista serviços de uma barbearia (público).
     */
    @Transactional(readOnly = true)
    public List<ServicoDTO> listarServicosDaBarbearia(Long barbeariaId) {
        return listarServicosDTO(barbeariaId);
    }
}
