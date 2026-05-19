document.addEventListener('DOMContentLoaded', function() {
    initTabs();
    initResponseTabs();
    initSendButton();
});

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

function initResponseTabs() {
    const respTabBtns = document.querySelectorAll('.response-tab-btn');
    respTabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-resp-tab');
            switchResponseTab(tabName);
        });
    });
}

function switchResponseTab(tabName) {
    document.querySelectorAll('.response-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.response-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.querySelector(`[data-resp-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

function initSendButton() {
    document.getElementById('sendBtn').addEventListener('click', sendRequest);
}

function addHeader() {
    const container = document.getElementById('headers-container');
    const newRow = document.createElement('div');
    newRow.className = 'header-row';
    newRow.innerHTML = `
        <input type="text" class="header-key" placeholder="Key">
        <input type="text" class="header-value" placeholder="Value">
        <button class="remove-btn" onclick="removeHeader(this)">×</button>
    `;
    container.appendChild(newRow);
}

function removeHeader(btn) {
    btn.parentElement.remove();
}

function getHeaders() {
    const headers = {};
    const headerRows = document.querySelectorAll('.header-row');
    headerRows.forEach(row => {
        const key = row.querySelector('.header-key').value.trim();
        const value = row.querySelector('.header-value').value.trim();
        if (key && value) {
            headers[key] = value;
        }
    });
    return headers;
}

function prettyPrintJSON(str) {
    try {
        const obj = JSON.parse(str);
        return JSON.stringify(obj, null, 2);
    } catch (e) {
        return str;
    }
}

async function sendRequest() {
    const method = document.getElementById('method').value;
    const url = document.getElementById('url').value;
    const bodyType = document.getElementById('body-type').value;
    const body = document.getElementById('body').value;
    const headers = getHeaders();
    
    if (!url) {
        alert('请输入URL');
        return;
    }

    const statusEl = document.getElementById('status');
    const timeEl = document.getElementById('time');
    const responseBodyEl = document.getElementById('response-body');
    const responseHeadersEl = document.getElementById('response-headers');

    statusEl.textContent = '状态: 发送中...';
    timeEl.textContent = '时间: -- ms';
    responseBodyEl.textContent = '';
    responseHeadersEl.textContent = '';

    const startTime = performance.now();

    try {
        const options = {
            method: method,
            headers: headers
        };

        if (method !== 'GET' && method !== 'HEAD' && body) {
            options.body = body;
        }

        const response = await fetch(url, options);
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);

        const contentType = response.headers.get('content-type');
        let responseText = '';
        
        if (contentType && contentType.includes('application/json')) {
            const jsonData = await response.json();
            responseText = JSON.stringify(jsonData, null, 2);
        } else {
            responseText = await response.text();
        }

        statusEl.textContent = `状态: ${response.status} ${response.statusText}`;
        timeEl.textContent = `时间: ${duration} ms`;
        responseBodyEl.textContent = responseText;

        let headersText = '';
        response.headers.forEach((value, key) => {
            headersText += `${key}: ${value}\n`;
        });
        responseHeadersEl.textContent = headersText;

        if (response.ok) {
            statusEl.style.color = '#4CAF50';
        } else {
            statusEl.style.color = '#f44336';
        }

    } catch (error) {
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);
        
        statusEl.textContent = '状态: 错误';
        timeEl.textContent = `时间: ${duration} ms`;
        responseBodyEl.textContent = `请求失败: ${error.message}\n\n注意: 如果目标API没有正确的CORS配置，浏览器会阻止跨域请求。`;
        statusEl.style.color = '#f44336';
    }
}
