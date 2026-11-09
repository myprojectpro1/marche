#!/data/data/com.termux/files/usr/bin/bash
# Lance l'appli et affiche l'adresse à ouvrir sur un autre téléphone
cd ~/marche
termux-wake-lock 2>/dev/null || true
IP=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}' | head -1)
[ -z "$IP" ] && IP=$(ifconfig 2>/dev/null | awk '/inet /{print $2}' | grep -v '^127' | head -1)
echo ""
if [ -n "$IP" ]; then
  echo "📱 Sur l'autre téléphone (même Wi-Fi), ouvre :  http://$IP:5173"
else
  echo "📱 IP introuvable : regarde-la dans Paramètres > Wi-Fi > ton réseau, puis ouvre http://IP:5173"
fi
echo ""
npm run dev
