/** @type {Array<{title: string, description: string, tags: string[], link: string, image: string, sparkline?: number[]}>} */
export const projects = [
  {
    title: 'BabyPandas Documentation',
    description: 'Built using Docusaurus. Provides students an easy-to-view documentation site that loosely mirrors the pandas documentation site.',
    tags: ['HTML', 'CSS', 'JavaScript'],
    link: 'https://github.com/dsc-courses/bpd-reference',
    image: '/img/bpd-reference.png',
  },
  {
    title: 'Portfolio Site',
    description: 'This site — built with SvelteKit, featuring a mouse-reactive Canvas time-series hero and component-scoped CSS.',
    tags: ['SvelteKit', 'Canvas API', 'CSS', 'GitHub Pages'],
    link: 'https://github.com/m1nce/portfolio',
    image: '',
    sparkline: [0.5, 0.55, 0.6, 0.58, 0.65, 0.7, 0.68, 0.75, 0.73, 0.8, 0.78, 0.85]
  }
];
