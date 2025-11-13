import './Loading.css';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <div className="loading">
      <i className="fas fa-spinner"></i>
      <p>{message}</p>
    </div>
  );
};

export default Loading;
