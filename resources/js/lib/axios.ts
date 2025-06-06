import axios from 'axios';

// Set the X-Requested-With header for all requests
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;

export default axios;

