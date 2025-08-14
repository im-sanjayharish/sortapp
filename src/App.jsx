import { useState, useMemo, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// A new component for our stylish toggle switch
const ThemeToggle = ({ theme, setTheme }) => {
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    toast.info(`Switched to ${newTheme} mode!`);
  };

  return (
    <div className="theme-toggle" onClick={toggleTheme} title="Toggle Theme">
      <div className={`toggle-slider ${theme}`}></div>
    </div>
  );
};


function App() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', body: '' });
  const [editingId, setEditingId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [theme, setTheme] = useState('dark'); // 'dark' or 'light'

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('https://jsonplaceholder.typicode.com/comments');
        if (!response.ok) throw new Error('Data could not be fetched!');
        const data = await response.json();
        setItems(data.slice(0, 300));
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, []);

  const filteredAndSortedItems = useMemo(() => {
    let filteredItems = items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.body.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (sortConfig.key) {
      filteredItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return filteredItems;
  }, [items, searchTerm, sortConfig]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedItems, currentPage, itemsPerPage]);

  const handleInputChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleEditClick = item => {
    setEditingId(item.id);
    setFormData({ name: item.name, email: item.email, body: item.body });
    toast.warn(`Editing comment by: ${item.name}`);
  };

  const handleDeleteClick = id => {
    setItems(items.filter(item => item.id !== id));
    toast.error('Comment deleted!');
  };

  const requestSort = key => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };
  
  const handleItemsPerPageChange = e => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.body) return;
    if (editingId !== null) {
      setItems(items.map(item => item.id === editingId ? { ...item, ...formData } : item));
      toast.info('Comment updated successfully!');
      setEditingId(null);
    } else {
      const newItem = { id: Date.now(), postId: 1, ...formData };
      setItems([newItem, ...items]);
      toast.success('New comment added!');
    }
    setFormData({ name: '', email: '', body: '' });
  };
  
  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);

  // Set the data-theme attribute on the root html element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  if (isLoading) return <div id="loader"><div className="spinner"></div></div>;
  if (error) return <div className="container" data-theme={theme}><h1>System Error: {error}</h1></div>;

  return (
    <div className="container">
      <ToastContainer theme={theme} position="bottom-right" autoClose={3000} hideProgressBar={false} />
      
      <header className="app-header">
        <h1>Data Stream Interface</h1>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </header>
      
      <div className="dashboard-layout">
        <main className="main-content">
          <section className="data-section table-section">
            <div className="table-controls">
              <input 
                type="text" 
                placeholder="Filter data stream..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select id="itemsPerPage" value={itemsPerPage} onChange={handleItemsPerPageChange}>
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
              </select>
            </div>
            <table className="user-table">
              <thead>
                <tr>
                  <th onClick={() => requestSort('name')}>Name</th>
                  <th onClick={() => requestSort('email')}>Email</th>
                  <th>Comment Body</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item, index) => (
                  <tr key={item.id} style={{ animationDelay: `${index * 30}ms` }}>
                    <td>{item.name}</td>
                    <td>{item.email}</td>
                    <td>{item.body}</td>
                    <td className="actions">
                      <button onClick={() => handleEditClick(item)}>Edit</button>
                      <button onClick={() => handleDeleteClick(item.id)} className="delete-btn">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <div className="pagination">
            <button className="btn" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button className="btn" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</button>
          </div>
        </main>

        <aside className="sidebar">
          <section className="data-section form-section">
            <h2>{editingId ? 'Edit Comment' : 'Add New Comment'}</h2>
            <form onSubmit={handleSubmit} className="user-form">
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Name" required />
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email" required />
              <textarea name="body" value={formData.body} onChange={handleInputChange} placeholder="Add your comment..." required></textarea>
              <button type="submit" className="btn btn-primary">{editingId ? 'Update Comment' : 'Add Comment'}</button>
            </form>
          </section>
        </aside>

      </div>
    </div>
  );
}

export default App;