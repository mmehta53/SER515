import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Option B: runtime mount helper
// Without changing `Project.jsx`, detect the Ideation page's DOM and mount the
// `IdeaCreation` React component into it. This uses a MutationObserver to watch
// for `.page-content` elements with an H2 titled 'Ideation'.
import IdeaCreation from './components/IdeaCreation';

function tryMountIdeaCreation() {
  const pageContents = document.querySelectorAll('.page-content');
  pageContents.forEach(node => {
    const h2 = node.querySelector('h2');
    if (h2 && h2.textContent.trim().toLowerCase() === 'ideation') {
      // Only mount once per node
      if (node.querySelector('#__idea_creation_mount')) return;
      const container = document.createElement('div');
      container.id = '__idea_creation_mount';
      // place below the H2
      h2.insertAdjacentElement('afterend', container);
      try {
        createRoot(container).render(<IdeaCreation />);
      } catch (e) {
        // ignore mount errors
        // console.error('Failed to mount IdeaCreation', e);
      }
    }
  });
}

// Run once after initial render (SPA navigation might not have the node yet)
setTimeout(tryMountIdeaCreation, 500);

// Also observe the document for future insertions (e.g., route changes)
const observer = new MutationObserver(() => {
  tryMountIdeaCreation();
});
observer.observe(document.body, { childList: true, subtree: true });
