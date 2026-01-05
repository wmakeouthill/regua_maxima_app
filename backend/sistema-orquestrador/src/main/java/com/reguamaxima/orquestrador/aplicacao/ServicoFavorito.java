package com.reguamaxima.orquestrador.aplicacao;

import com.reguamaxima.autenticacao.dominio.entidade.Usuario;
import com.reguamaxima.autenticacao.dominio.repository.UsuarioRepository;
import com.reguamaxima.orquestrador.dominio.dto.AdicionarFavoritoDTO;
import com.reguamaxima.orquestrador.dominio.dto.FavoritoDTO;
import com.reguamaxima.orquestrador.dominio.dto.FavoritosIdsDTO;
import com.reguamaxima.orquestrador.dominio.entidade.Barbearia;
import com.reguamaxima.orquestrador.dominio.entidade.Barbeiro;
import com.reguamaxima.orquestrador.dominio.entidade.Favorito;
import com.reguamaxima.orquestrador.dominio.enums.TipoFavorito;
import com.reguamaxima.orquestrador.dominio.repository.BarbeariaRepository;
import com.reguamaxima.orquestrador.dominio.repository.BarbeiroRepository;
import com.reguamaxima.orquestrador.dominio.repository.FavoritoRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Serviço de aplicação para gerenciamento de favoritos.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ServicoFavorito {

    private final FavoritoRepository favoritoRepository;
    private final UsuarioRepository usuarioRepository;
    private final BarbeariaRepository barbeariaRepository;
    private final BarbeiroRepository barbeiroRepository;

    // ========== Adicionar Favorito ==========

    /**
     * Adiciona um item aos favoritos do usuário.
     */
    @Transactional
    public FavoritoDTO adicionarFavorito(Long usuarioId, AdicionarFavoritoDTO dto) {
        log.info("Adicionando favorito para usuário {}: tipo={}", usuarioId, dto.tipo());

        // Validar DTO
        if (!dto.isValido()) {
            throw new IllegalArgumentException(dto.getMensagemErro());
        }

        // Buscar usuário
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        Favorito favorito;

        if (dto.tipo() == TipoFavorito.BARBEARIA) {
            // Verificar se já favoritou
            if (favoritoRepository.existsByUsuarioIdAndBarbeariaId(usuarioId, dto.barbeariaId())) {
                throw new IllegalStateException("Barbearia já está nos favoritos");
            }

            // Buscar barbearia
            Barbearia barbearia = barbeariaRepository.findById(dto.barbeariaId())
                    .orElseThrow(() -> new EntityNotFoundException("Barbearia não encontrada"));

            favorito = Favorito.builder()
                    .usuario(usuario)
                    .tipo(TipoFavorito.BARBEARIA)
                    .barbearia(barbearia)
                    .build();

        } else {
            // Verificar se já favoritou
            if (favoritoRepository.existsByUsuarioIdAndBarbeiroId(usuarioId, dto.barbeiroId())) {
                throw new IllegalStateException("Barbeiro já está nos favoritos");
            }

            // Buscar barbeiro
            Barbeiro barbeiro = barbeiroRepository.findById(dto.barbeiroId())
                    .orElseThrow(() -> new EntityNotFoundException("Barbeiro não encontrado"));

            favorito = Favorito.builder()
                    .usuario(usuario)
                    .tipo(TipoFavorito.BARBEIRO)
                    .barbeiro(barbeiro)
                    .build();
        }

        favorito = favoritoRepository.save(favorito);
        log.info("Favorito adicionado com sucesso: id={}", favorito.getId());

        return FavoritoDTO.fromEntity(favorito);
    }

    // ========== Remover Favorito ==========

    /**
     * Remove uma barbearia dos favoritos.
     */
    @Transactional
    public void removerBarbeariaFavorita(Long usuarioId, Long barbeariaId) {
        log.info("Removendo barbearia {} dos favoritos do usuário {}", barbeariaId, usuarioId);

        if (!favoritoRepository.existsByUsuarioIdAndBarbeariaId(usuarioId, barbeariaId)) {
            throw new EntityNotFoundException("Barbearia não está nos favoritos");
        }

        favoritoRepository.deleteByUsuarioIdAndBarbeariaId(usuarioId, barbeariaId);
        log.info("Barbearia removida dos favoritos com sucesso");
    }

    /**
     * Remove um barbeiro dos favoritos.
     */
    @Transactional
    public void removerBarbeiroFavorito(Long usuarioId, Long barbeiroId) {
        log.info("Removendo barbeiro {} dos favoritos do usuário {}", barbeiroId, usuarioId);

        if (!favoritoRepository.existsByUsuarioIdAndBarbeiroId(usuarioId, barbeiroId)) {
            throw new EntityNotFoundException("Barbeiro não está nos favoritos");
        }

        favoritoRepository.deleteByUsuarioIdAndBarbeiroId(usuarioId, barbeiroId);
        log.info("Barbeiro removido dos favoritos com sucesso");
    }

    // ========== Toggle Favorito (adiciona se não existe, remove se existe)
    // ==========

    /**
     * Alterna o status de favorito de uma barbearia.
     * 
     * @return true se foi adicionado, false se foi removido
     */
    @Transactional
    public boolean toggleBarbeariaFavorita(Long usuarioId, Long barbeariaId) {
        if (favoritoRepository.existsByUsuarioIdAndBarbeariaId(usuarioId, barbeariaId)) {
            removerBarbeariaFavorita(usuarioId, barbeariaId);
            return false;
        } else {
            adicionarFavorito(usuarioId, new AdicionarFavoritoDTO(TipoFavorito.BARBEARIA, barbeariaId, null));
            return true;
        }
    }

    /**
     * Alterna o status de favorito de um barbeiro.
     * 
     * @return true se foi adicionado, false se foi removido
     */
    @Transactional
    public boolean toggleBarbeiroFavorito(Long usuarioId, Long barbeiroId) {
        if (favoritoRepository.existsByUsuarioIdAndBarbeiroId(usuarioId, barbeiroId)) {
            removerBarbeiroFavorito(usuarioId, barbeiroId);
            return false;
        } else {
            adicionarFavorito(usuarioId, new AdicionarFavoritoDTO(TipoFavorito.BARBEIRO, null, barbeiroId));
            return true;
        }
    }

    // ========== Listar Favoritos ==========

    /**
     * Lista todos os favoritos do usuário.
     */
    @Transactional(readOnly = true)
    public List<FavoritoDTO> listarFavoritos(Long usuarioId) {
        return favoritoRepository.findByUsuarioId(usuarioId)
                .stream()
                .map(FavoritoDTO::fromEntity)
                .toList();
    }

    /**
     * Lista barbearias favoritas do usuário.
     */
    @Transactional(readOnly = true)
    public List<FavoritoDTO> listarBarbeariasFavoritas(Long usuarioId) {
        return favoritoRepository.findBarbeariasById(usuarioId)
                .stream()
                .map(FavoritoDTO::fromEntity)
                .toList();
    }

    /**
     * Lista barbeiros favoritos do usuário.
     */
    @Transactional(readOnly = true)
    public List<FavoritoDTO> listarBarbeirosFavoritos(Long usuarioId) {
        return favoritoRepository.findBarbeirosById(usuarioId)
                .stream()
                .map(FavoritoDTO::fromEntity)
                .toList();
    }

    // ========== IDs dos Favoritos ==========

    /**
     * Retorna os IDs de todas as barbearias e barbeiros favoritados pelo usuário.
     * Útil para o frontend marcar os corações nos cards.
     */
    @Transactional(readOnly = true)
    public FavoritosIdsDTO obterIdsFavoritos(Long usuarioId) {
        List<Long> barbeariasIds = favoritoRepository.findBarbeariasIdsByUsuarioId(usuarioId);
        List<Long> barbeirosIds = favoritoRepository.findBarbeirosIdsByUsuarioId(usuarioId);
        return new FavoritosIdsDTO(barbeariasIds, barbeirosIds);
    }

    // ========== Verificações ==========

    /**
     * Verifica se uma barbearia está nos favoritos do usuário.
     */
    @Transactional(readOnly = true)
    public boolean isBarbeariaFavoritada(Long usuarioId, Long barbeariaId) {
        return favoritoRepository.existsByUsuarioIdAndBarbeariaId(usuarioId, barbeariaId);
    }

    /**
     * Verifica se um barbeiro está nos favoritos do usuário.
     */
    @Transactional(readOnly = true)
    public boolean isBarbeiroFavoritado(Long usuarioId, Long barbeiroId) {
        return favoritoRepository.existsByUsuarioIdAndBarbeiroId(usuarioId, barbeiroId);
    }

    // ========== Contagens ==========

    /**
     * Conta quantos usuários favoritaram uma barbearia.
     */
    @Transactional(readOnly = true)
    public long contarFavoritosBarbearia(Long barbeariaId) {
        return favoritoRepository.countByBarbeariaId(barbeariaId);
    }

    /**
     * Conta quantos usuários favoritaram um barbeiro.
     */
    @Transactional(readOnly = true)
    public long contarFavoritosBarbeiro(Long barbeiroId) {
        return favoritoRepository.countByBarbeiroId(barbeiroId);
    }
}
