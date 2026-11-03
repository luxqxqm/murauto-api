const TIME_ZONE = 'Europe/Kyiv';

const formatKyivTime = (date) =>
  new Intl.DateTimeFormat('uk-UA', {
    timeZone: TIME_ZONE,
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

const sendTelegramMessage = async (text) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    throw new Error('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set');
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
      // Don't wait forever if Telegram is slow
      signal: AbortSignal.timeout(5000),
    },
  );

  if (!response.ok) {
    const { description } = await response.json().catch(() => ({}));
    throw new Error(`Telegram ${response.status}: ${description}`);
  }
};

export const notifyNewBooking = (booking, service) => {
  const car = booking.plate ? `${booking.car}, ${booking.plate}` : booking.car;
  const lines = [
    '🆕 Новий запис',
    `Послуга: ${service.name}`,
    `Час: ${formatKyivTime(booking.startAt)}`,
    `Імʼя: ${booking.clientName}`,
    `Телефон: ${booking.phone}`,
    `Авто: ${car}`,
  ];
  if (booking.comment) {
    lines.push(`Коментар: ${booking.comment}`);
  }

  return sendTelegramMessage(lines.join('\n'));
};
