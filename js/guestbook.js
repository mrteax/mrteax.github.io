/*
 * 留言板 (Guestbook) — 基于 giscus + GitHub Discussions 的真实双向互动。
 * 访客用 GitHub 账号登录即可留言/回复/点表情，所有内容存在你仓库的
 * Discussions 里，零自建后端、零数据库。
 *
 * --- 开启步骤（一次性，约 5 分钟）-------------------------------------------
 *   1) 打开仓库 Settings → General → Features，勾选 "Discussions"。
 *   2) 安装 giscus App：https://github.com/apps/giscus ，授权给本仓库
 *      (mrteax/mrteax.github.io)。
 *   3) 打开 https://giscus.app ，填入仓库 mrteax/mrteax.github.io，
 *      选择 Discussion 分类（建议新建一个叫 "Guestbook" 的 Announcements 分类），
 *      页面会生成 data-repo-id 和 data-category-id 两个值。
 *   4) 把这两个值填到下面的 GISCUS.repoId / GISCUS.categoryId 即可，
 *      其余配置已按本站设好（中文、跟随明暗主题、底部输入框）。
 * ===========================================================================
 */
(() => {
  'use strict';

  const GISCUS = {
    repo: 'mrteax/mrteax.github.io',
    repoId: 'R_kgDOAhl6og',
    category: 'Announcements',
    categoryId: 'DIC_kwDOAhl6os4C-EEk',
    mapping: 'pathname',
    lang: 'zh-CN',
  };

  const mount = document.getElementById('giscus');
  const hint = document.getElementById('gbHint');
  if (!mount) return;

  const themeOf = () =>
    (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

  // Not configured yet → show a friendly placeholder instead of a broken widget.
  if (!GISCUS.repoId || !GISCUS.categoryId) {
    if (hint) {
      hint.innerHTML = '💬 留言板即将开放：在 GitHub 仓库启用 Discussions 并填好 ' +
        '<code>js/guestbook.js</code> 里的 repoId / categoryId 即可上线。';
      hint.classList.add('gb-hint-pending');
    }
    return;
  }

  const s = document.createElement('script');
  s.src = 'https://giscus.app/client.js';
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.setAttribute('data-repo', GISCUS.repo);
  s.setAttribute('data-repo-id', GISCUS.repoId);
  s.setAttribute('data-category', GISCUS.category);
  s.setAttribute('data-category-id', GISCUS.categoryId);
  s.setAttribute('data-mapping', GISCUS.mapping);
  s.setAttribute('data-strict', '0');
  s.setAttribute('data-reactions-enabled', '1');
  s.setAttribute('data-emit-metadata', '0');
  s.setAttribute('data-input-position', 'top');
  s.setAttribute('data-theme', themeOf());
  s.setAttribute('data-lang', GISCUS.lang);
  s.setAttribute('data-loading', 'lazy');
  mount.appendChild(s);

  // Keep giscus in sync with the site's light/dark toggle.
  function pushTheme() {
    const frame = document.querySelector('iframe.giscus-frame');
    if (!frame) return;
    frame.contentWindow.postMessage(
      { giscus: { setConfig: { theme: themeOf() } } },
      'https://giscus.app'
    );
  }
  new MutationObserver(pushTheme).observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-theme'],
  });
})();
