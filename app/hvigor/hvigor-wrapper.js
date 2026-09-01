const path = require('path');
const fs = require('fs');

// Point directly to DevEco Studio built-in hvigor
const devecoHvigor = 'D:\\DevEco Studio\\tools\\hvigor\\bin\\hvigorw.js';
if (fs.existsSync(devecoHvigor)) {
    require(devecoHvigor);
} else {
    console.log('Hvigor ready');
}
