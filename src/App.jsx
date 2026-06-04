import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CalendarDays, CloudUpload, Download, RefreshCw } from 'lucide-react';
import './styles.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4300';

const fallbackMenu = {
  restaurantId: 'tuermli',
  restaurantName: 'Türmli',
  template: 'tuermli',
  date: '29.05.2026',
  introTitle: 'Menü inklusive',
  introDescription: 'Chili con Carne oder Tagessalat',
  dishes: [
    { name: 'Risotto', description: 'Gambas | Zitrone Sauce', price: 'CHF 19.80' },
    { name: 'Lachs vom Grill', description: 'Safran Sauce | Parmesanrisotto', price: 'CHF 22.80' }
  ]
};

function App() {
  const renderMenu = useRenderPayload();
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('tuermli');
  const [selectedDay, setSelectedDay] = useState(0);
  const [menu, setMenu] = useState(renderMenu || fallbackMenu);
  const [status, setStatus] = useState('Ready');
  const menuRequestId = useRef(0);

  useEffect(() => {
    if (renderMenu) return;
    fetch(`${API_BASE}/api/restaurants`)
      .then((response) => response.json())
      .then(setRestaurants)
      .catch(() => setRestaurants([{ id: 'tuermli', name: 'Türmli' }, { id: 'kuonimatt', name: 'Kuonimatt' }]));
  }, [renderMenu]);

  useEffect(() => {
    if (renderMenu) return;
    loadMenu(selectedRestaurant, 0);
  }, [selectedRestaurant, renderMenu]);

  async function loadMenu(restaurantId, dayIndex = selectedDay) {
    const requestId = menuRequestId.current + 1;
    menuRequestId.current = requestId;
    setStatus('Loading menu');
    const response = await fetch(`${API_BASE}/api/menu/${restaurantId}?day=${dayIndex}`);
    const nextMenu = await response.json();
    if (requestId !== menuRequestId.current) return;
    setSelectedDay(Number(nextMenu.selectedDay ?? dayIndex));
    setMenu(nextMenu);
    setStatus('Ready');
  }

  function changeRestaurant(restaurantId) {
    setSelectedRestaurant(restaurantId);
    setSelectedDay(0);
  }

  function changeDay(dayIndex) {
    setSelectedDay(dayIndex);
    loadMenu(selectedRestaurant, dayIndex);
  }

  function updateDish(index, field, value) {
    setMenu((current) => ({
      ...current,
      dishes: current.dishes.map((dish, dishIndex) => (dishIndex === index ? { ...dish, [field]: value } : dish))
    }));
  }

  async function downloadPng() {
    setStatus('Rendering PNG');
    const response = await fetch(`${API_BASE}/api/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menu })
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${menu.restaurantName}-${menu.date}.png`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus('PNG downloaded');
  }

  async function sendToDrive() {
    setStatus('Rendering for Drive');
    const response = await fetch(`${API_BASE}/api/render-to-drive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menu })
    });
    const result = await response.json();
    setStatus(result.uploaded ? 'Uploaded to Drive' : `Saved locally: ${result.localPath}`);
  }

  async function sendAllToDrive() {
    setStatus('Rendering all restaurants');
    const response = await fetch(`${API_BASE}/api/render-all-to-drive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day: selectedDay, date: menu.date })
    });
    const result = await response.json();
    const completed = result.uploaded || result.savedLocal || 0;
    setStatus(result.uploaded ? `Uploaded ${completed} stories to Drive` : `Saved ${completed} stories: ${result.exportFolder}`);
  }

  if (renderMenu) {
    return <StoryFrame menu={renderMenu} />;
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <aside className="control-panel">
          <div className="panel-heading">
            <p>Tagesmenu automation</p>
            <strong>{status}</strong>
          </div>

          <label>
            Restaurant
            <select value={selectedRestaurant} onChange={(event) => changeRestaurant(event.target.value)}>
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </label>

          {Array.isArray(menu.days) && menu.days.length > 1 ? (
            <label>
              Menu day
              <select value={selectedDay} onChange={(event) => changeDay(Number(event.target.value))}>
                {menu.days.map((day) => (
                  <option key={day.index} value={day.index}>
                    {day.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div className="field-grid">
            <label>
              <span>Date</span>
              <input value={menu.date} onChange={(event) => setMenu({ ...menu, date: event.target.value })} />
            </label>
            <label>
              <span>Restaurant</span>
              <input value={menu.restaurantName} onChange={(event) => setMenu({ ...menu, restaurantName: event.target.value })} />
            </label>
          </div>

          <label>
            Included line
            <input value={menu.introDescription} onChange={(event) => setMenu({ ...menu, introDescription: event.target.value })} />
          </label>

          <div className="dishes">
            {menu.dishes.map((dish, index) => (
              <div className="dish-editor" key={index}>
                <strong>Dish {index + 1}</strong>
                <input value={dish.name} onChange={(event) => updateDish(index, 'name', event.target.value)} />
                <input value={dish.description} onChange={(event) => updateDish(index, 'description', event.target.value)} />
                <input value={dish.price} onChange={(event) => updateDish(index, 'price', event.target.value)} />
              </div>
            ))}
          </div>

          <div className="button-row">
            <button type="button" onClick={() => loadMenu(selectedRestaurant, selectedDay)}>
              <RefreshCw size={18} />
              Refresh
            </button>
            <button type="button" onClick={downloadPng}>
              <Download size={18} />
              PNG
            </button>
            <button type="button" onClick={sendToDrive}>
              <CloudUpload size={18} />
              Drive
            </button>
            <button type="button" onClick={sendAllToDrive}>
              <CloudUpload size={18} />
              All Drive
            </button>
          </div>
        </aside>

        <section className="preview-stage">
          <div className="preview-meta">
            <CalendarDays size={18} />
            <span>Instagram story 1080 x 1920</span>
          </div>
          <StoryFrame menu={menu} preview />
        </section>
      </section>
    </main>
  );
}

function StoryFrame({ menu, preview = false }) {
  if (menu.template === 'fischerstube' || menu.restaurantId === 'fischerstube') {
    const frame = <FischerstubeStory menu={menu} />;
    return preview ? <div className="story-preview-viewport">{frame}</div> : frame;
  }

  if (menu.template === 'zellfeld' || menu.restaurantId === 'zellfeld') {
    const frame = <ZellfeldStory menu={menu} />;
    return preview ? <div className="story-preview-viewport">{frame}</div> : frame;
  }

  if (menu.template === 'lux' || menu.restaurantId === 'lux') {
    const frame = <LuxStory menu={menu} />;
    return preview ? <div className="story-preview-viewport">{frame}</div> : frame;
  }

  if (menu.template === 'militaergarten' || menu.restaurantId === 'militaergarten') {
    const frame = <MilitaergartenStory menu={menu} />;
    return preview ? <div className="story-preview-viewport">{frame}</div> : frame;
  }

  if (menu.template === 'kuonimatt' || menu.restaurantId === 'kuonimatt') {
    const frame = <KuonimattStory menu={menu} />;
    return preview ? <div className="story-preview-viewport">{frame}</div> : frame;
  }

  const frame = (
    <article className="story-frame is-tuermli" data-story-frame>
      <img className="story-template" src={`${API_BASE}/api/template/tuermli`} alt="" />
      <div className="story-content">
        <div className="date-pill">{menu.date}</div>

        <section className="menu-list">
          {menu.dishes.map((dish, index) => (
            <div className="story-dish" key={`${dish.name}-${index}`}>
              <h2>{dish.name}</h2>
              {dish.description ? <p>{dish.description}</p> : null}
              <strong>{dish.price}</strong>
            </div>
          ))}
        </section>

        <section className="intro">
          <h1>{menu.introTitle || 'Menü inklusive'}</h1>
          <p>{splitIncluded(menu.introDescription).map((line) => <span key={line}>{line}</span>)}</p>
        </section>
      </div>
    </article>
  );

  return preview ? <div className="story-preview-viewport">{frame}</div> : frame;
}

function FischerstubeStory({ menu }) {
  return (
    <article className="story-frame is-fischerstube" data-story-frame>
      <img className="story-template" src={`${API_BASE}/api/template/fischerstube`} alt="" />
      <div className="fs-content">
        <div className="fs-date">{menu.date}</div>

        <section className="fs-dishes">
          {menu.dishes.slice(0, 3).map((dish, index) => (
            <React.Fragment key={`${dish.name}-${index}`}>
              <div className="fs-dish">
                <h2 className={fitFischerstubeTitleClass(dish.name)}>{dish.name}</h2>
                <p>{descriptionLines(dish).slice(0, 3).map((line) => <span key={line}>{line}</span>)}</p>
                <strong>{dish.price}</strong>
              </div>
              {index < 2 ? <img className={`fs-separator fs-separator-${index + 1}`} src="/assets/fs-separator.svg" alt="" /> : null}
            </React.Fragment>
          ))}
        </section>
      </div>
    </article>
  );
}

function ZellfeldStory({ menu }) {
  return (
    <article className="story-frame is-zellfeld" data-story-frame>
      <img className="story-template" src={`${API_BASE}/api/template/zellfeld`} alt="" />
      <div className="zf-content">
        <div className="zf-date">{menu.date}</div>

        <section className="zf-dishes">
          {menu.dishes.slice(0, 2).map((dish, index) => (
            <div className="zf-dish" key={`${dish.name}-${index}`}>
              <h2 className={fitZellfeldTitleClass(dish.name)}>
                {zellfeldTitleLines(dish.name).map((line) => <span key={line}>{line}</span>)}
              </h2>
              <p>{descriptionLines(dish).map((line) => <span key={line}>{line}</span>)}</p>
              <strong>{dish.price}</strong>
            </div>
          ))}
        </section>

        <section className="zf-pizza">
          <h2>{menu.pizza?.name || 'Pizza nach Wahl'}</h2>
        </section>

        <section className="zf-included">
          <h2>{menu.introTitle || 'Menu inklusive'}</h2>
          <p>{splitIncluded(menu.introDescription).map((line) => <span key={line}>{line}</span>)}</p>
        </section>
      </div>
    </article>
  );
}

function LuxStory({ menu }) {
  return (
    <article className="story-frame is-lux" data-story-frame>
      <img className="story-template" src={`${API_BASE}/api/template/lux`} alt="" />
      <div className="lux-content">
        <div className="lux-date">{menu.date}</div>

        <section className="lux-dishes">
          {menu.dishes.slice(0, 2).map((dish, index) => (
            <div className="lux-dish" key={`${dish.name}-${index}`}>
              <h2 className={fitLuxTitleClass(dish.name)}>{renderLuxText(dish.name)}</h2>
              <p className={fitLuxDescriptionClass(descriptionLines(dish).join(' '))}>{descriptionLines(dish).map((line) => <span key={line}>{renderLuxText(line)}</span>)}</p>
              <strong>{dish.price}</strong>
            </div>
          ))}
        </section>
      </div>
    </article>
  );
}

function MilitaergartenStory({ menu }) {
  return (
    <article className="story-frame is-militaergarten" data-story-frame>
      <img className="story-template" src={`${API_BASE}/api/template/militaergarten`} alt="" />
      <div className="miga-content">
        <div className="miga-date">{migaText(menu.date)}</div>

        <section className="miga-dishes">
          {menu.dishes.slice(0, 2).map((dish, index) => (
            <div className="miga-dish" key={`${dish.name}-${index}`}>
              <h2 className={fitMigaTitleClass(migaText(dish.name))}>{migaText(dish.name)}</h2>
              <p>{descriptionLines(dish).map((line) => <span key={line}>{line}</span>)}</p>
              <strong>{dish.price}</strong>
            </div>
          ))}
        </section>
      </div>
    </article>
  );
}

function KuonimattStory({ menu }) {
  return (
    <article className="story-frame is-kuonimatt" data-story-frame>
      <img className="story-template" src={`${API_BASE}/api/template/kuonimatt`} alt="" />
      <div className="kuo-content">
        <div className="kuo-date">{menu.date}</div>

        <section className="kuo-dishes">
          {menu.dishes.slice(0, 2).map((dish, index) => (
            <div className="kuo-dish" key={`${dish.name}-${index}`}>
              <h2 className={fitTextClass(dish.name)}>{dish.name}</h2>
              <p className={fitDescriptionClass(descriptionLines(dish).join(' '))}>{descriptionLines(dish).map((line) => <span key={line}>{line}</span>)}</p>
              <strong>{dish.price}</strong>
            </div>
          ))}
        </section>

        <section className="kuo-pizza">
          <h2>{menu.pizza?.name || 'HOLZOFENPIZZA'}</h2>
          <p>{menu.pizza?.description || 'nach Wahl'}</p>
        </section>

        <section className="kuo-included">
          <h2>{menu.introTitle || 'MENÜ INKLUSIVE'}</h2>
          <p>{menu.introDescription}</p>
        </section>
      </div>
    </article>
  );
}

function useRenderPayload() {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('menu');
    if (!encoded) return null;
    try {
      const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return fallbackMenu;
    }
  }, []);
}

function splitIncluded(value) {
  const text = String(value || '');
  const match = text.match(/^(.+?)\s+oder\s+(.+)$/i);
  return match ? [`${match[1]}`, `oder ${match[2]}`] : [text];
}

function migaText(value) {
  return String(value || '').replace(/[.,]/g, (character) => (character === '.' ? ',' : '.'));
}

function renderLuxText(value) {
  return String(value || '').split(/([ÄÖÜäöü])/g).map((part, index) => (
    /[ÄÖÜäöü]/.test(part) ? <span className="lux-umlaut" key={`${part}-${index}`}>{part}</span> : part
  ));
}

function descriptionLines(dish) {
  if (Array.isArray(dish.descriptionLines) && dish.descriptionLines.length) {
    return dish.descriptionLines;
  }
  return String(dish.description || '').split(/\n+/).filter(Boolean);
}

function fitTextClass(text) {
  const length = String(text || '').length;
  if (length > 44) return 'fit-xxlong';
  if (length > 32) return 'fit-xlong';
  if (length > 24) return 'fit-long';
  return '';
}

function fitMigaTitleClass(text) {
  const length = String(text || '').length;
  if (length > 70) return 'fit-miga-xxlong';
  if (length > 54) return 'fit-miga-xlong';
  if (length > 42) return 'fit-miga-long';
  return '';
}

function fitZellfeldTitleClass(text) {
  const length = String(text || '').length;
  if (length > 76) return 'fit-zf-xxlong';
  if (length > 58) return 'fit-zf-xlong';
  if (length > 34) return 'fit-zf-long';
  return '';
}

function zellfeldTitleLines(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return [''];

  const words = text.split(' ');
  if (words.length < 3 || text.length <= 28) return [text];

  return balanceWords(words, text.length > 76 ? 3 : 2);
}

function balanceWords(words, lineCount) {
  if (lineCount === 2) {
    let best = [words.join(' ')];
    let bestScore = Number.POSITIVE_INFINITY;

    for (let index = 1; index < words.length; index += 1) {
      const lines = [words.slice(0, index).join(' '), words.slice(index).join(' ')];
      const lengths = lines.map((line) => line.length);
      const score = Math.max(...lengths) + Math.abs(lengths[0] - lengths[1]) * 0.55;

      if (score < bestScore) {
        best = lines;
        bestScore = score;
      }
    }

    return best;
  }

  let best = [words.join(' ')];
  let bestScore = Number.POSITIVE_INFINITY;

  for (let first = 1; first < words.length - 1; first += 1) {
    for (let second = first + 1; second < words.length; second += 1) {
      const lines = [
        words.slice(0, first).join(' '),
        words.slice(first, second).join(' '),
        words.slice(second).join(' ')
      ];
      const lengths = lines.map((line) => line.length);
      const average = lengths.reduce((sum, length) => sum + length, 0) / lengths.length;
      const variance = lengths.reduce((sum, length) => sum + Math.abs(length - average), 0);
      const score = Math.max(...lengths) + variance * 0.45;

      if (score < bestScore) {
        best = lines;
        bestScore = score;
      }
    }
  }

  return best;
}

function fitFischerstubeTitleClass(text) {
  const length = String(text || '').length;
  if (length > 46) return 'fit-fs-xxlong';
  if (length > 34) return 'fit-fs-xlong';
  if (length > 27) return 'fit-fs-long';
  return '';
}

function fitLuxTitleClass(text) {
  const length = String(text || '').length;
  if (length > 46) return 'fit-lux-title-xxlong';
  if (length > 34) return 'fit-lux-title-xlong';
  return '';
}

function fitLuxDescriptionClass(text) {
  const length = String(text || '').length;
  if (length > 70) return 'fit-lux-desc-xxlong';
  if (length > 52) return 'fit-lux-desc-xlong';
  return '';
}

function fitDescriptionClass(text) {
  return String(text || '').length > 44 ? 'fit-desc-long' : '';
}

createRoot(document.getElementById('root')).render(<App />);
