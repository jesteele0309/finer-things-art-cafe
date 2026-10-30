/* Keep saved links on the complete studio while retaining access to old local work. */
(function () {
  'use strict';
  const oldOrigin = 'https://jesteele0309.github.io';
  const oldPath = '/finer-things-art-cafe/innerworld';
  const studioOrigin = 'https://innerworld-web-production.up.railway.app';
  const current = new URL(location.href);
  const legacy = current.origin === oldOrigin &&
    (current.pathname === oldPath || current.pathname.startsWith(oldPath + '/'));
  const recovery = legacy && current.searchParams.get('local') === '1';

  if (legacy && !recovery) {
    const destination = new URL(studioOrigin + '/');
    destination.search = current.search;
    destination.hash = current.hash;
    location.replace(destination.href);
    return;
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (recovery) {
      const notice = document.createElement('aside');
      notice.setAttribute('role', 'status');
      notice.style.cssText = 'padding:16px;background:#fff4db;color:#30291f;position:relative;z-index:1000';
      notice.append('This is your old device collection. Open Privacy & settings, choose Export private backup, then restore that file in the full studio. ');
      const link = document.createElement('a');
      link.href = studioOrigin + '/';
      link.textContent = 'Open the full studio';
      notice.append(link);
      document.body.prepend(notice);
    } else if (current.origin === studioOrigin) {
      const link = document.createElement('a');
      link.href = oldOrigin + oldPath + '/?local=1';
      link.textContent = 'Recover a collection from the old address';
      link.className = 'tiny';
      document.querySelector('footer')?.append(link);
    }
  });
})();
