// Combiner les messages du parent et les messages locaux SANS doublons (fusion robuste)
const history = messages || [];
const local = localMessages[user._id] || [];
const allMessagesMap = new Map();
// Ajoute d'abord l'historique
for (const msg of history) {
  if (msg._id) allMessagesMap.set(msg._id, msg);
  else allMessagesMap.set(msg.timestamp + msg.text + msg.type, msg);
}
// Ajoute/écrase avec les messages locaux (plus récents ou modifiés)
for (const msg of local) {
  if (msg._id) allMessagesMap.set(msg._id, msg);
  else allMessagesMap.set(msg.timestamp + msg.text + msg.type, msg);
}
const allMessages = Array.from(allMessagesMap.values()); 