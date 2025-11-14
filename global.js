function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "/"
    : "/portfolio/";

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact' },
    { url: 'resume/', title: 'Resume' },
    { url: 'https://github.com/m1nce', title: 'GitHub' }
]

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
    let url = p.url;
    url = !url.startsWith('http') ? BASE_PATH + url : url;
    let title = p.title;

    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    a.classList.toggle(
        'current',
        a.host === location.host && a.pathname === location.pathname,
    )
    if (a.host != location.host) {
        a.target = "_blank"
    }
    nav.append(a)
}

const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
document.body.insertAdjacentHTML(
  'afterbegin',
  `
	<label class="color-scheme">
		Theme:
		<select>
			<option>auto</option>
            <option>light</option>
            <option>dark</option>
		</select>
	</label>`,
);

const select = document.querySelector(".color-scheme");

if ("colorScheme" in localStorage) {
    const saved = localStorage.colorScheme;
    document.documentElement.style.setProperty('color-scheme', saved)
    select.value = saved;
}

select.addEventListener('input', function (event) {
    localStorage.colorScheme = event.target.value;
    document.documentElement.style.setProperty('color-scheme', event.target.value);
});

const form = document.querySelector('form');

form?.addEventListener('submit', function (event) {
    event.preventDefault();

    const data = new FormData(form);
    const params = [];

    for (const [name, value] of data) {
        params.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
    }

    const url = `${form.action}?${params.join('&')}`;
    location.href = url;
});
