// panels/VolumeProfilePanel/VolumeProfile.tsx
// Perfil de volume por preco: representa volumeProfileStore.
import { useVolumeProfileStore } from '../../store/volumeProfileStore';
import { PanelShell } from '../PanelShell/PanelShell';

export function VolumeProfile() {
  const levels = useVolumeProfileStore((s) => s.levels);
  const poc = useVolumeProfileStore((s) => s.poc);
  const vah = useVolumeProfileStore((s) => s.vah);
  const val = useVolumeProfileStore((s) => s.val);

  if (levels.length === 0) {
    return (
      <PanelShell title="Volume Profile">
        <p>Sem execuções na sessão.</p>
      </PanelShell>
    );
  }

  return (
    <PanelShell title="Volume Profile">
      <div>
        <span>POC {poc.toFixed(2)}</span>
        <span>VAH {vah.toFixed(2)}</span>
        <span>VAL {val.toFixed(2)}</span>
      </div>
      <ul>
        {levels.map((l) => (
          <li key={l.price}>
            <span>{l.price.toFixed(2)}</span>
            <span
              style={{ display: 'inline-block', width: `${l.barWidth}%` }}
              aria-label={`volume ${l.totalVolume}`}
            >
              ▓
            </span>
            <span>
              {l.totalVolume} (C{l.buyVolume}/V{l.sellVolume})
            </span>
            {l.isPOC && <strong>POC</strong>}
            {l.isVAH && <span>VAH</span>}
            {l.isVAL && <span>VAL</span>}
          </li>
        ))}
      </ul>
    </PanelShell>
  );
}
