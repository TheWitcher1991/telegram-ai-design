(() => {
  const conversation = document.querySelector('.conversation');
  const shell = document.querySelector('.window');
  const inbox = document.querySelector('.inbox');
  const details = document.querySelector('.details');
  const initialConversation = conversation.innerHTML;
  const toast = document.querySelector('#toast');
  const dialogRoot = document.querySelector('#dialog-root');
  let toastTimer;
  let currentPage = 'chats';
  const mobileLayout = window.matchMedia('(max-width: 620px)');
  if (mobileLayout.matches) shell.classList.add('mobile-inbox');

  const pageMarkup = {
    calls: `<header class="page-heading"><div><span class="page-kicker">СВЯЗЬ</span><h2>Звонки</h2><p>История ваших звонков</p></div><button class="primary-action" data-action="start-call">＋ Новый звонок</button></header><div class="page-content"><h3>Сегодня</h3><button class="call-row" data-action="call"><span class="call-avatar avatar-masha">М</span><span><b>Маша Воронцова</b><small>Входящий · 12:48</small></span><span class="call-type">↙</span></button><button class="call-row" data-action="call"><span class="call-avatar avatar-ilya">И</span><span><b>Илья Соколов</b><small>Исходящий · 10:07 · 18 мин</small></span><span class="call-type">↗</span></button><h3>Вчера</h3><button class="call-row" data-action="call"><span class="call-avatar avatar-dima">Д</span><span><b>Дима Беляев</b><small>Пропущенный · 19:22</small></span><span class="call-type missed">↙</span></button></div>`,
    saved: `<header class="page-heading"><div><span class="page-kicker">ЛИЧНОЕ</span><h2>Сохранённое</h2><p>Сообщения и файлы, которые вы сохранили</p></div></header><div class="page-content saved-list"><article class="saved-item"><span class="saved-icon">↗</span><div><b>Гайд по типографике</b><p>https://design.example/typography</p><small>Сохранено из чата «Дизайн-среда» · вчера</small></div><button aria-label="Удалить сохранённое" data-action="remove-saved">•••</button></article><article class="saved-item"><span class="saved-icon file">PDF</span><div><b>План на ноябрь.pdf</b><p>1,2 МБ · PDF-документ</p><small>Сохранено из чата «Команда Север» · 7 ноября</small></div><button aria-label="Удалить сохранённое" data-action="remove-saved">•••</button></article><article class="saved-item"><span class="saved-icon note">✎</span><div><b>Идея для проекта</b><p>Сделать быстрые реакции на сообщения</p><small>Заметка · 5 ноября</small></div><button aria-label="Удалить сохранённое" data-action="remove-saved">•••</button></article></div>`,
    settings: `<header class="page-heading"><div><span class="page-kicker">ПРИЛОЖЕНИЕ</span><h2>Настройки</h2><p>Настройте Север под себя</p></div></header><div class="page-content settings-list"><section><h3>Уведомления</h3><button class="setting-row" data-action="toggle"><span><b>Уведомления на рабочем столе</b><small>Показывать новые сообщения</small></span><i class="switch on"></i></button><button class="setting-row" data-action="toggle"><span><b>Звук сообщений</b><small>Воспроизводить звук при получении</small></span><i class="switch on"></i></button></section><section><h3>Внешний вид</h3><button class="setting-row" data-action="toggle"><span><b>Компактный список чатов</b><small>Показывать больше диалогов на экране</small></span><i class="switch"></i></button></section><section><h3>Профиль</h3><div class="profile-row"><div class="avatar avatar-you">А</div><span><b>Александр</b><small>@alexander · аккаунт макета</small></span><button data-action="edit-profile">Изменить</button></div></section></div>`
  };

  function notify(message) {
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
  }

  function activatePage(page) {
    currentPage = page;
    document.querySelectorAll('.rail-link').forEach(link => link.classList.toggle('selected', link.dataset.page === page));
    details.hidden = page !== 'chats';
    if (page === 'chats') {
      conversation.innerHTML = initialConversation;
      inbox.hidden = false;
      if (mobileLayout.matches) shell.classList.add('mobile-inbox');
      return;
    }
    shell.classList.remove('mobile-inbox');
    inbox.hidden = false;
    conversation.innerHTML = pageMarkup[page] || pageMarkup.chats;
  }

  function openChat(item) {
    document.querySelectorAll('.chat-item').forEach(row => row.classList.toggle('active', row === item));
    activatePage('chats');
    shell.classList.remove('mobile-inbox');
    const title = item.querySelector('.chat-heading strong')?.textContent || 'Новый диалог';
    const avatar = item.querySelector('.avatar')?.className || 'group-avatar';
    const glyph = item.querySelector('.avatar')?.childNodes[0]?.textContent?.trim() || title.slice(0, 1);
    const group = item.dataset.kind === 'group';
    const heading = conversation.querySelector('.conversation-title');
    const groupAvatar = conversation.querySelector('.conversation-header .group-avatar');
    heading.querySelector('strong').textContent = title;
    heading.querySelector('span').textContent = group ? 'Группа · участники на связи' : 'был(а) недавно';
    groupAvatar.className = `group-avatar ${avatar.split(' ').filter(c => c.startsWith('avatar-')).join(' ')}`;
    groupAvatar.textContent = glyph;
    if (item.dataset.chat !== 'team') {
      const messages = conversation.querySelector('.messages');
      messages.innerHTML = `<div class="day-divider"><span>Сегодня</span></div><div class="empty-chat"><span class="empty-chat-avatar ${avatar.split(' ').filter(c => c.startsWith('avatar-')).join(' ')}">${glyph}</span><b>${title}</b><p>${group ? 'Вы присоединились к группе. Начните разговор.' : 'Это начало вашей переписки.'}</p></div>`;
      conversation.querySelector('.reply-context').lastChild.textContent = ` Ответ в «${title}»`;
    }
    details.querySelector('.details-hero h2').textContent = title;
    details.querySelector('.details-hero p').textContent = group ? 'Группа · 8 участников' : 'Личный чат';
  }

  document.addEventListener('click', event => {
    const pageLink = event.target.closest('[data-page]');
    if (pageLink) {
      event.preventDefault();
      activatePage(pageLink.dataset.page);
      return;
    }

    const filter = event.target.closest('[data-filter]');
    if (filter) {
      document.querySelectorAll('[data-filter]').forEach(button => button.classList.toggle('active', button === filter));
      document.querySelectorAll('.chat-item').forEach(item => {
        item.hidden = filter.dataset.filter !== 'all' && item.dataset.kind !== filter.dataset.filter;
      });
      return;
    }

    const chat = event.target.closest('.chat-item');
    if (chat) {
      event.preventDefault();
      openChat(chat);
      return;
    }

    const button = event.target.closest('[data-action]');
    if (!button) return;
    switch (button.dataset.action) {
      case 'details':
        details.hidden = !details.hidden;
        break;
      case 'call':
      case 'start-call':
        notify('Звонок в этом макете не подключён');
        break;
      case 'search-message': {
        const query = window.prompt('Найти в переписке');
        if (!query) break;
        const message = [...conversation.querySelectorAll('.bubble')].find(node => node.textContent.toLowerCase().includes(query.toLowerCase()));
        message ? (message.scrollIntoView({ behavior: 'smooth', block: 'center' }), message.classList.add('search-match'), setTimeout(() => message.classList.remove('search-match'), 1400)) : notify('Сообщение не найдено');
        break;
      }
      case 'new-chat': {
        const name = window.prompt('Имя собеседника или название группы');
        if (!name?.trim()) break;
        const item = document.createElement('a');
        item.className = 'chat-item';
        item.href = '#new-chat';
        item.dataset.chat = `new-${Date.now()}`;
        item.dataset.kind = 'personal';
        item.innerHTML = '<div class="avatar avatar-new"></div><div class="chat-copy"><div class="chat-heading"><strong></strong><time>сейчас</time></div><div class="chat-preview"><span>Начните переписку</span></div></div>';
        item.querySelector('.avatar').textContent = name.trim().slice(0, 1).toUpperCase();
        item.querySelector('strong').textContent = name.trim();
        document.querySelector('.chat-list').prepend(item);
        openChat(item);
        break;
      }
      case 'toggle':
        button.querySelector('.switch')?.classList.toggle('on');
        break;
      case 'edit-profile':
        notify('Профиль демонстрационный');
        break;
      case 'remove-saved':
        button.closest('.saved-item')?.remove();
        notify('Удалено из сохранённого');
        break;
      case 'download-file':
        notify('Файл доступен в макете');
        break;
    }

    if (button.classList.contains('close-details')) details.hidden = true;
    if (button.closest('.detail-actions')) {
      const label = button.textContent.trim();
      if (label.includes('Поиск')) document.querySelector('[data-action="search-message"]')?.click();
      else if (label.includes('Участники')) details.querySelector('.detail-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      else if (label.includes('Звонок')) notify('Звонок в этом макете не подключён');
    }
    if (button.getAttribute('aria-label') === 'Скачать макет') notify('Файл доступен в макете');
  });

  document.querySelector('#chat-search').addEventListener('input', event => {
    const query = event.target.value.trim().toLocaleLowerCase('ru');
    document.querySelectorAll('.chat-item').forEach(item => {
      item.hidden = !item.textContent.toLocaleLowerCase('ru').includes(query);
    });
  });

  document.addEventListener('submit', event => {
    if (!event.target.matches('.composer')) return;
    event.preventDefault();
    const input = event.target.querySelector('.composer-input');
    const value = input.value.trim();
    if (!value) return;
    const messages = conversation.querySelector('.messages');
    const row = document.createElement('div');
    row.className = 'message-row';
    row.innerHTML = `<div class="avatar avatar-you small">А</div><div class="message-content own"><div class="bubble"></div><time>сейчас <span class="read">✓✓</span></time></div>`;
    row.querySelector('.bubble').textContent = value;
    messages.append(row);
    input.value = '';
    messages.scrollTop = messages.scrollHeight;
  });

  document.addEventListener('click', event => {
    const attach = event.target.closest('.attach');
    if (attach) document.querySelector('#file-input').click();
    if (event.target.closest('.emoji')) {
      const input = document.querySelector('.composer-input');
      input.value += '☺';
      input.focus();
    }
  });
  document.querySelector('#file-input').addEventListener('change', event => {
    const file = event.target.files[0];
    if (file) notify(`Файл «${file.name}» прикреплён к макету`);
  });
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      document.querySelector('#chat-search').focus();
    }
    if (event.key === 'Escape') dialogRoot.innerHTML = '';
  });
})();
