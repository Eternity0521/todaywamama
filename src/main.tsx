import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/tokens.css';

// 测试用重置：打开 /?reset 即可清空本地数据重新走一遍（不用开控制台）。
if (new URLSearchParams(window.location.search).has('reset')) {
  localStorage.clear();
  const url = new URL(window.location.href);
  url.searchParams.delete('reset');
  window.history.replaceState(null, '', url);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
