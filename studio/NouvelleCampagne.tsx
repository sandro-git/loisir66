import { Box, Button, Stack, Text } from '@sanity/ui'
import { AddIcon } from '@sanity/icons/Add'
import { useRouter } from 'sanity/router'

// Crée une campagne avec un identifiant « campagnes.<uuid> » : le point rend le document privé
// (illisible via l'API publique du dataset). Voir schemas/campagne.ts.
export function NouvelleCampagne() {
  const router = useRouter()
  return (
    <Box padding={4}>
      <Stack gap={4}>
        <Text size={1} muted>
          Les campagnes sont privées : elles ne sont lisibles que par le site (côté serveur) et dans ce Studio.
          Créez-les uniquement avec ce bouton.
        </Text>
        <Button
          icon={AddIcon}
          text="Nouvelle campagne"
          tone="primary"
          onClick={() => router.navigateIntent('create', { type: 'campagne', id: `campagnes.${crypto.randomUUID()}` })}
        />
      </Stack>
    </Box>
  )
}
