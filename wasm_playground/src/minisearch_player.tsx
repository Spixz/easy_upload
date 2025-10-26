import { useEffect, useState } from "react"
import MiniSearch, { type SearchResult } from "minisearch"
import {
    TextField,
    List,
    ListItem,
    ListItemText,
    Box,
    CircularProgress,
    Typography,
} from "@mui/material"

interface MagickCommand {
    title: string
    command: string
    description: string
    example?: string
    intent: string
}

export default function MinisearchPlayer() {
    // 🔧 États typés
    const [query, setQuery] = useState<string>("")
    const [results, setResults] = useState<SearchResult[]>([])
    const [miniSearch, setMiniSearch] = useState<MiniSearch<MagickCommand> | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    // Charger le JSON local
    useEffect(() => {
        async function loadData() {
            try {
                const response = await fetch("/imagemagick_commands.json")
                if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`)
                const data: MagickCommand[] = await response.json()

                // Initialiser MiniSearch
                const ms = new MiniSearch<MagickCommand>({
                    fields: ["title", "intent"], // champs indexés
                    storeFields: ["title", "description", "command", "example", "intent"], // champs renvoyés
                    idField: 'command'
                })
                ms.addAll(data)
                setMiniSearch(ms)
            } catch (err: unknown) {
                console.log(err);
                setError(err instanceof Error ? err.message : "Erreur inconnue")
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [])

    // Rechercher dès que la query change
    useEffect(() => {
        if (miniSearch && query.trim()) {
            const searchResults = miniSearch.search(query, { fuzzy: 0.4 })
            setResults(searchResults)
        } else {
            setResults([])
        }
    }, [query, miniSearch])

    // 🧱 UI
    if (loading) {
        return (
            <Box sx={{ textAlign: "center", mt: 4 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 2 }}>
                    Chargement des commandes...
                </Typography>
            </Box>
        )
    }

    if (error) {
        return (
            <Box sx={{ textAlign: "center", mt: 4, color: "red" }}>
                Erreur lors du chargement : {error}
            </Box>
        )
    }

    return (
        <Box sx={{ p: 2, mx: "auto" }}>
            {/* Barre de recherche */}
            <TextField
                fullWidth
                variant="outlined"
                label="Rechercher une commande ImageMagick"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                sx={{ mb: 2 }}
            />

            {/* Liste des résultats */}
            <List>
                {results.map((r) => (
                    <ListItem key={r.command} divider alignItems="flex-start">
                        <ListItemText
                            primary={
                                <strong>
                                    {r.title} / <code>{r.command}</code>
                                </strong>
                            }
                            secondary={
                                <>
                                    <p style={{ margin: "6px 0" }}>{r.description}</p>
                                    {r.intent && (
                                        <p style={{ margin: "4px 0", color: "#1976d2", fontStyle: "italic" }}>
                                            {r.intent}
                                        </p>
                                    )}
                                    {r.example && (
                                        <p
                                            style={{
                                                marginTop: "6px",
                                                fontFamily: "monospace",
                                                background: "#f5f5f5",
                                                padding: "6px 8px",
                                                borderRadius: "6px",
                                            }}
                                        >
                                            {r.example}
                                        </p>
                                    )}
                                </>
                            }
                        />
                    </ListItem>
                ))}
            </List>

            {/* Message si aucun résultat */}
            {results.length === 0 && query && (
                <Typography variant="body2" sx={{ textAlign: "center", mt: 2, color: "gray" }}>
                    Aucun résultat trouvé pour « {query} »
                </Typography>
            )}
        </Box>
    )
}