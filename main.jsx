import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Home, LibraryBig, Plus, ChartNoAxesCombined, UserRound, Search, Bell, Heart, Bookmark, Check, BookOpen, ChevronRight, ChevronLeft, SlidersHorizontal, Pencil, Trash2, X, UserPlus, ScrollText, Settings, Download, WifiOff, Sparkles, CalendarDays } from 'lucide-react';
import { getAll, put, remove, seedIfEmpty } from './db';
import './styles.css';

const nav = [
  { id: 'home', label: 'Inicio', Icon: Home },
  { id: 'shelves', label: 'Estantería', Icon: LibraryBig },
  { id: 'add', label: 'Añadir', Icon: Plus },
  { id: 'stats', label: 'Estadísticas', Icon: ChartNoAxesCombined },
  { id: 'profile', label: 'Perfil', Icon: UserRound }
];
const statuses = ['Pendiente', 'Leyendo', 'Leído', 'Abandonado'];
const uid = () => crypto.randomUUID();

function App() {
  const [section, setSection] = useState('home');
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [query, setQuery] = useState('');
  const [shelfTab, setShelfTab] = useState('Géneros');
  const [filter, setFilter] = useState('Todos');
  const [notice, setNotice] = useState('');
  const [showAuthorForm, setShowAuthorForm] = useState(false);
  const [showBookForm, setShowBookForm] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);

  const refresh = async () => {
    const [b, a] = await Promise.all([getAll('books'), getAll('authors')]);
    setBooks(b.sort((x, y) => (y.createdAt || 0) - (x.createdAt || 0)));
    setAuthors(a.sort((x, y) => x.name.localeCompare(y.name, 'es')));
  };
  useEffect(() => {
    seedIfEmpty().then(refresh).catch(() => setNotice('No se pudo abrir el almacenamiento local.'));
    const onOnline = () => setOnline(true), onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline); window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 2800); return () => clearTimeout(t); }, [notice]);

  const filteredBooks = useMemo(() => books.filter(b => `${b.title} ${(b.authorNames || []).join(' ')} ${b.genre}`.toLowerCase().includes(query.toLowerCase())), [books, query]);
  const addBook = async (book) => { await put('books', { ...book, id: uid(), createdAt: Date.now() }); await refresh(); setShowBookForm(false); setSection('shelves'); setNotice('Libro guardado en tu biblioteca'); };
  const addAuthor = async (author) => { await put('authors', { ...author, id: uid(), favorite: false }); await refresh(); setShowAuthorForm(false); setNotice('Autor añadido a tu biblioteca'); };
  const updateBook = async (book) => { await put('books', book); await refresh(); setSelectedBook(null); setNotice('Cambios guardados'); };
  const deleteBook = async (id) => { await remove('books', id); await refresh(); setSelectedBook(null); setNotice('Libro eliminado'); };

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setSection('home')} aria-label="Ir a inicio"><span className="brand-mark"><BookOpen size={23}/></span><span>MyLibrary<small>THE READING ROOM</small></span></button>
      <div className="top-actions"><button className="icon-btn" onClick={() => setSection('notices')} aria-label="Notificaciones"><Bell size={20}/><i className="unread-dot"/></button><span className={`connection ${online ? '' : 'offline'}`} title={online ? 'Con conexión' : 'Sin conexión'}>{online ? '●' : <WifiOff size={15}/>}</span></div>
    </header>

    <main className="main-content">
      {section === 'home' && <HomeScreen books={books} onNavigate={setSection} onBook={setSelectedBook}/>}
      {section === 'shelves' && <ShelfScreen books={filteredBooks} allBooks={books} authors={authors} query={query} setQuery={setQuery} tab={shelfTab} setTab={setShelfTab} filter={filter} setFilter={setFilter} onBook={setSelectedBook} onAuthor={() => setShowAuthorForm(true)}/>}
      {section === 'add' && <AddScreen onAddBook={() => setShowBookForm(true)} onAddAuthor={() => setShowAuthorForm(true)} onNavigate={setSection}/>}
      {section === 'stats' && <StatsScreen books={books} authors={authors}/>}
      {section === 'profile' && <ProfileScreen books={books} authors={authors}/>}
      {section === 'notices' && <NoticesScreen onBack={() => setSection('home')}/>}
    </main>

    <nav className="bottom-nav" aria-label="Navegación principal">{nav.map(({id,label,Icon}) => <button key={id} className={`nav-item ${section === id ? 'active' : ''}`} onClick={() => { setSection(id); setQuery(''); }}><Icon size={21}/><span>{label}</span></button>)}</nav>
    {notice && <div className="toast" role="status">{notice}</div>}
    {showBookForm && <BookForm authors={authors} onSave={addBook} onClose={() => setShowBookForm(false)}/>}
    {showAuthorForm && <AuthorForm onSave={addAuthor} onClose={() => setShowAuthorForm(false)}/>}
    {selectedBook && <BookDetail book={selectedBook} onClose={() => setSelectedBook(null)} onSave={updateBook} onDelete={deleteBook}/>}
  </div>;
}

function SectionHeading({eyebrow, title, subtitle, action}) { return <div className="section-heading"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</div>; }
function StatPill({label,value}) { return <div className="stat-pill"><strong>{value}</strong><span>{label}</span></div>; }
function BookRow({book,onClick}) { return <button className="book-row" onClick={onClick}><div className="mini-cover"><BookOpen size={21}/></div><div className="book-meta"><strong>{book.title}</strong><span>{(book.authorNames || []).join(', ') || 'Autor desconocido'}</span><small>{book.genre || 'Sin género'} · {book.pages || '—'} páginas</small></div><span className={`status-tag ${book.status?.toLowerCase()}`}>{book.status}</span><ChevronRight size={17}/></button>; }

function HomeScreen({books,onNavigate,onBook}) {
  const current = books.filter(b => b.status === 'Leyendo');
  const recent = [...books].slice(0, 4);
  const quick = [{label:'Favoritos',value:books.filter(b=>b.favorite).length,Icon:Heart,filter:'Favoritos'},{label:'Pendientes',value:books.filter(b=>b.status==='Pendiente').length,Icon:Bookmark,filter:'Pendiente'},{label:'Leídos',value:books.filter(b=>b.status==='Leído').length,Icon:Check,filter:'Leído'},{label:'Abandonados',value:books.filter(b=>b.status==='Abandonado').length,Icon:BookOpen,filter:'Abandonado'}];
  return <><SectionHeading eyebrow="TU RINCÓN DE LECTURA" title="Bienvenido a casa" subtitle="Cada libro guarda un mundo. Aquí tienes el tuyo." action={<span className="date-chip"><CalendarDays size={14}/> Mi biblioteca</span>}/>
    <div className="quick-grid">{quick.map(({label,value,Icon,filter})=><button className="quick-card" key={label} onClick={()=>onNavigate('shelves')}><Icon size={20}/><strong>{value}</strong><span>{label}</span></button>)}</div>
    <section className="feature-panel"><div className="feature-top"><span className="eyebrow">LECTURA ACTUAL</span><span className="ornament">✦</span></div>{current.length ? <>{current.slice(0,1).map(b=><div className="current-book" key={b.id}><div className="large-cover"><BookOpen size={35}/><span>MY LIBRARY</span></div><div><h2>{b.title}</h2><p>{(b.authorNames||[]).join(', ')}</p><span className="gold-caption">EN CURSO</span><button className="text-link" onClick={()=>onBook(b)}>Abrir libro <ChevronRight size={15}/></button></div></div>)}</> : <div className="empty-current"><BookOpen size={30}/><div><strong>Tu próxima aventura te espera</strong><span>Añade un libro y márcalo como «Leyendo».</span></div><button className="small-gold-btn" onClick={()=>onNavigate('add')}>Añadir libro</button></div>}</section>
    <div className="section-line"><div><span className="eyebrow">EN TUS ESTANTERÍAS</span><h2>Lecturas recientes</h2></div><button className="text-link" onClick={()=>onNavigate('shelves')}>Ver todo <ChevronRight size={15}/></button></div>
    <div className="book-list">{recent.length ? recent.map(b=><BookRow key={b.id} book={b} onClick={()=>onBook(b)}/>) : <EmptyState text="Todavía no hay libros. Añade el primero para llenar tus estanterías."/>}</div>
    <section className="goal-card"><div><span className="eyebrow">OBJETIVO ANUAL</span><h2>{books.filter(b=>b.status==='Leído').length} <small>libros leídos</small></h2><p>Tu progreso lector de este año</p></div><div className="goal-ring"><strong>{Math.min(100,Math.round(books.filter(b=>b.status==='Leído').length/24*100))}%</strong></div></section>
  </>;
}

function ShelfScreen({books,allBooks,authors,query,setQuery,tab,setTab,filter,setFilter,onBook,onAuthor}) {
  const tabs=['Géneros','Estados','Mis estanterías','Autores','Sagas'];
  const genres=[...new Set(allBooks.map(b=>b.genre).filter(Boolean))];
  const visible = books.filter(b => filter==='Todos' || (filter==='Favoritos' ? b.favorite : b.status===filter));
  return <><SectionHeading eyebrow="EL CORAZÓN DE TU BIBLIOTECA" title="Estantería" subtitle="Tus historias, ordenadas a tu manera."/>
    <div className="search-box"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar libro o autor..."/><SlidersHorizontal size={17}/></div>
    <div className="tabs-scroll">{tabs.map(t=><button key={t} className={`tab ${tab===t?'selected':''}`} onClick={()=>{setTab(t);setFilter('Todos')}}>{t}</button>)}</div>
    {tab==='Autores' ? <><div className="section-line"><div><span className="eyebrow">ÍNDICE DE AUTORES</span><h2>Mis autores ({authors.length})</h2></div><button className="small-gold-btn" onClick={onAuthor}><UserPlus size={15}/> Añadir</button></div><div className="author-grid">{authors.map(a=><div className="author-card" key={a.id}><div className="author-avatar">{a.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</div><strong>{a.name}</strong><span>{allBooks.filter(b=>(b.authorIds||[]).includes(a.id)).length} libros</span></div>)}</div></> : tab==='Sagas' ? <EmptyState text="Aquí aparecerán tus sagas cuando incorpores libros con una serie asociada."/> : tab==='Géneros' || tab==='Mis estanterías' ? <><div className="shelf-wood">{(tab==='Géneros' ? genres : ['Mis favoritos','Por releer','Ediciones especiales']).map((g,i)=><button className="wood-plaque" key={g} onClick={()=>setFilter(tab==='Géneros'?g:'Favoritos')}><span className="plaque-icon">{i===0?'❧':'✦'}</span><span>{g}</span><small>{tab==='Géneros'?allBooks.filter(b=>b.genre===g).length:allBooks.filter(b=>b.favorite).length} libros</small></button>)}</div><div className="section-line"><div><span className="eyebrow">COLECCIÓN</span><h2>{filter==='Todos'?'Todos tus libros':filter}</h2></div><button className="text-link" onClick={()=>setFilter('Todos')}>Ver todos</button></div><div className="book-list">{visible.filter(b=>filter==='Todos'||filter==='Favoritos'?true:b.genre===filter).map(b=><BookRow key={b.id} book={b} onClick={()=>onBook(b)}/>)}</div></> : <><div className="filter-chips">{['Todos',...statuses,'Favoritos'].map(f=><button key={f} className={filter===f?'chip active-chip':'chip'} onClick={()=>setFilter(f)}>{f}</button>)}</div><div className="book-list">{visible.map(b=><BookRow key={b.id} book={b} onClick={()=>onBook(b)}/>)}</div></>}
  </>;
}

function AddScreen({onAddBook,onAddAuthor,onNavigate}) { return <><SectionHeading eyebrow="AMPLÍA TU COLECCIÓN" title="Añadir" subtitle="Una nueva historia siempre encuentra su lugar."/><div className="add-options"><button className="add-option primary-option" onClick={onAddBook}><span className="option-icon"><Plus size={25}/></span><span><strong>Añadir libro</strong><small>Registra un libro en tu biblioteca</small></span><ChevronRight/></button><button className="add-option" onClick={onAddAuthor}><span className="option-icon"><UserPlus size={24}/></span><span><strong>Añadir autor</strong><small>Completa tu índice de autores</small></span><ChevronRight/></button><button className="add-option" onClick={()=>onNavigate('shelves')}><span className="option-icon"><Search size={24}/></span><span><strong>Explorar estantería</strong><small>Consulta los libros que ya guardaste</small></span><ChevronRight/></button></div><div className="hint-card"><Sparkles size={20}/><p><strong>Un solo registro, muchas estanterías.</strong><br/>Cada libro se guarda una sola vez y puede aparecer en sus géneros, estados, autores y colecciones.</p></div></>; }

function StatsScreen({books,authors}) { const read=books.filter(b=>b.status==='Leído').length, pages=books.filter(b=>b.status==='Leído').reduce((s,b)=>s+(Number(b.pages)||0),0); const genres=[...new Set(books.map(b=>b.genre).filter(Boolean))]; return <><SectionHeading eyebrow="TU VIAJE ENTRE PÁGINAS" title="Estadísticas" subtitle="Una mirada a todo lo que has leído."/><div className="stats-grid"><StatPill label="Libros" value={books.length}/><StatPill label="Leídos" value={read}/><StatPill label="Autores" value={authors.length}/><StatPill label="Páginas leídas" value={pages.toLocaleString('es-ES')}/></div><section className="panel"><span className="eyebrow">DISTRIBUCIÓN POR ESTADO</span>{statuses.map(s=><div className="bar-row" key={s}><div><span>{s}</span><strong>{books.filter(b=>b.status===s).length}</strong></div><div className="bar-track"><i style={{width:`${books.length?books.filter(b=>b.status===s).length/books.length*100:0}%`}}/></div></div>)}</section><section className="panel"><span className="eyebrow">TUS GÉNEROS</span>{genres.length?genres.map(g=><div className="bar-row" key={g}><div><span>{g}</span><strong>{books.filter(b=>b.genre===g).length}</strong></div><div className="bar-track"><i style={{width:`${books.length?books.filter(b=>b.genre===g).length/books.length*100:0}%`}}/></div></div>):<EmptyState text="Añade libros para descubrir tus géneros favoritos."/>}</section></>; }

function ProfileScreen({books,authors}) { const exportData=async()=>{const data={exportedAt:new Date().toISOString(),books,authors};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='mylibrary-backup.json';a.click();URL.revokeObjectURL(url);}; return <><SectionHeading eyebrow="TU ESPACIO PERSONAL" title="Perfil" subtitle="La configuración de tu biblioteca."/><div className="profile-hero"><div className="profile-seal"><BookOpen size={34}/></div><h2>MyLibrary</h2><span>THE READING ROOM</span><p>{books.length} libros · {authors.length} autores</p></div><div className="settings-list"><div className="settings-row"><span><LibraryBig/> Mi biblioteca</span><ChevronRight/></div><div className="settings-row"><span><Settings/> Preferencias de lectura</span><ChevronRight/></div><button className="settings-row" onClick={exportData}><span><Download/> Crear copia de seguridad</span><ChevronRight/></button><div className="settings-row"><span><ScrollText/> Sobre la aplicación</span><span className="version">Versión 0.1.0</span></div></div><p className="muted-note">Tus datos se guardan localmente en este dispositivo. Guarda copias de seguridad periódicas para proteger tu biblioteca.</p></>; }

function NoticesScreen({onBack}) { return <><button className="back-link" onClick={onBack}><ChevronLeft size={18}/> Volver</button><SectionHeading eyebrow="AVISOS DE TU BIBLIOTECA" title="Notificaciones" subtitle="Aquí encontrarás tus recordatorios y novedades."/><EmptyState text="No tienes notificaciones por ahora."/></>; }
function EmptyState({text}) { return <div className="empty-state"><BookOpen size={27}/><p>{text}</p></div>; }

function Modal({title,onClose,children}) { return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal"><div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose}><X/></button></div>{children}</div></div>; }
function BookForm({authors,onSave,onClose}) { const [title,setTitle]=useState(''),[authorIds,setAuthorIds]=useState([]),[genre,setGenre]=useState('Fantasía'),[status,setStatus]=useState('Pendiente'),[pages,setPages]=useState(''),[favorite,setFavorite]=useState(false); const submit=e=>{e.preventDefault();if(!title.trim())return;const selected=authors.filter(a=>authorIds.includes(a.id));onSave({title:title.trim(),authorIds,authorNames:selected.map(a=>a.name),genre,status,pages:Number(pages)||0,favorite});}; return <Modal title="Añadir libro" onClose={onClose}><form onSubmit={submit} className="form-stack"><label>Título del libro *<input required value={title} onChange={e=>setTitle(e.target.value)} placeholder="Nombre del libro"/></label><label>Autor o autores<select multiple value={authorIds} onChange={e=>setAuthorIds([...e.target.selectedOptions].map(o=>o.value))}>{authors.map(a=><option value={a.id} key={a.id}>{a.name}</option>)}</select><small>Mantén pulsado para seleccionar varios autores.</small></label><label>Género<input value={genre} onChange={e=>setGenre(e.target.value)} placeholder="Fantasía, novela..."/></label><div className="form-two"><label>Estado<select value={status} onChange={e=>setStatus(e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label><label>Páginas<input type="number" min="0" value={pages} onChange={e=>setPages(e.target.value)} placeholder="0"/></label></div><label className="check-label"><input type="checkbox" checked={favorite} onChange={e=>setFavorite(e.target.checked)}/> Marcar como favorito</label><button className="gold-button" type="submit">Guardar en mi biblioteca</button></form></Modal>; }
function AuthorForm({onSave,onClose}) { const [name,setName]=useState(''),[nationality,setNationality]=useState(''),[birthDate,setBirthDate]=useState(''),[bio,setBio]=useState(''); return <Modal title="Añadir autor" onClose={onClose}><form className="form-stack" onSubmit={e=>{e.preventDefault();if(name.trim())onSave({name:name.trim(),nationality,birthDate,bio});}}><label>Nombre del autor *<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre completo"/></label><label>Nacionalidad<input value={nationality} onChange={e=>setNationality(e.target.value)} placeholder="Nacionalidad"/></label><label>Fecha de nacimiento<input type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)}/></label><label>Biografía<textarea rows="3" value={bio} onChange={e=>setBio(e.target.value)} placeholder="Una breve biografía..."/></label><button className="gold-button">Guardar autor</button></form></Modal>; }
function BookDetail({book,onClose,onSave,onDelete}) { const [status,setStatus]=useState(book.status),[favorite,setFavorite]=useState(book.favorite); return <Modal title="Ficha del libro" onClose={onClose}><div className="detail-cover"><BookOpen size={36}/></div><h2 className="detail-title">{book.title}</h2><p className="detail-author">{(book.authorNames||[]).join(', ')||'Autor desconocido'}</p><div className="form-stack"><label>Estado de lectura<select value={status} onChange={e=>setStatus(e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label><label className="check-label"><input type="checkbox" checked={favorite} onChange={e=>setFavorite(e.target.checked)}/> Favorito</label><div className="detail-facts"><span>{book.genre||'Sin género'}</span><span>{book.pages||'—'} páginas</span></div><button className="gold-button" onClick={()=>onSave({...book,status,favorite})}>Guardar cambios</button><button className="danger-button" onClick={()=>{if(confirm('¿Eliminar este libro de tu biblioteca?'))onDelete(book.id)}}><Trash2 size={16}/> Eliminar libro</button></div></Modal>; }

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
