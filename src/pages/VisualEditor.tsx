import { Navigate } from 'react-router-dom';

// Legacy entry — the primary AI Creative Studio lives at /visual-editor
const VisualEditor = () => <Navigate to="/visual-editor" replace />;

export default VisualEditor;
