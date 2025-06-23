import axios from 'axios';

export function log(stack, level, pkg, message) {
  axios.post('http://20.244.56.144/evaluation-service/logs', {
    stack,
    level,
    package: pkg,
    message
  }).catch(() => {
    // Prevent crash on logging failure
  });
}
