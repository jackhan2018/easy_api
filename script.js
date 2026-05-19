document.addEventListener('DOMContentLoaded', function() {
    initTabs();
    initResponseTabs();
    initSendButton();
    initBodyTypeChange();
    initCurlUpdate();
    updateCurlPreview();
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
    updateCurlPreview();
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

const ALLOWED_FILE_TYPES = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.tiff': 'image/tiff'
};

function initBodyTypeChange() {
    const bodyTypeSelect = document.getElementById('body-type');
    bodyTypeSelect.addEventListener('change', function() {
        const bodyContent = document.getElementById('body-content');
        const formDataContainer = document.getElementById('form-data-container');

        if (this.value === 'form') {
            bodyContent.style.display = 'none';
            formDataContainer.style.display = 'block';
            if (document.getElementById('form-fields').children.length === 0) {
                addFormTextField();
            }
        } else {
            bodyContent.style.display = 'block';
            formDataContainer.style.display = 'none';
        }
        updateCurlPreview();
    });
}

function addFormTextField(key = '', value = '') {
    const container = document.getElementById('form-fields');
    const fieldRow = document.createElement('div');
    fieldRow.className = 'form-field-row';
    fieldRow.innerHTML = `
        <input type="text" class="form-field-key" placeholder="Key" value="${key}">
        <input type="text" class="form-field-value" placeholder="Value" value="${value}">
        <button class="remove-btn" onclick="removeFormField(this)">×</button>
    `;
    container.appendChild(fieldRow);
    attachFieldListeners(fieldRow);
}

function addFormFileField(key = '') {
    const container = document.getElementById('form-fields');
    const fieldRow = document.createElement('div');
    fieldRow.className = 'form-field-row file-field-row';
    fieldRow.innerHTML = `
        <input type="text" class="form-field-key" placeholder="Key" value="${key}">
        <input type="file" class="form-field-file" accept=".pdf,.png,.jpg,.jpeg,.tiff">
        <span class="file-name"></span>
        <button class="remove-btn" onclick="removeFormField(this)">×</button>
    `;
    container.appendChild(fieldRow);

    const fileInput = fieldRow.querySelector('.form-field-file');
    fileInput.addEventListener('change', function() {
        const fileNameSpan = fieldRow.querySelector('.file-name');
        if (this.files.length > 0) {
            const file = this.files[0];
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            if (!ALLOWED_FILE_TYPES[ext]) {
                alert(`不支持的文件类型: ${ext}\n仅支持: PDF, PNG, JPG, TIFF`);
                this.value = '';
                fileNameSpan.textContent = '';
            } else {
                fileNameSpan.textContent = file.name;
            }
        } else {
            fileNameSpan.textContent = '';
        }
        updateCurlPreview();
    });

    attachFieldListeners(fieldRow);
}

function removeFormField(btn) {
    btn.parentElement.remove();
    updateCurlPreview();
}

function attachFieldListeners(row) {
    const inputs = row.querySelectorAll('input[type="text"]');
    inputs.forEach(input => {
        input.addEventListener('input', updateCurlPreview);
    });
}

function getFormData() {
    const fields = [];
    const fieldRows = document.querySelectorAll('.form-field-row');
    fieldRows.forEach(row => {
        const key = row.querySelector('.form-field-key').value.trim();
        if (!key) return;

        if (row.classList.contains('file-field-row')) {
            const fileInput = row.querySelector('.form-field-file');
            if (fileInput.files.length > 0) {
                fields.push({
                    type: 'file',
                    key: key,
                    file: fileInput.files[0]
                });
            }
        } else {
            const value = row.querySelector('.form-field-value').value;
            fields.push({
                type: 'text',
                key: key,
                value: value
            });
        }
    });
    return fields;
}

function buildFormData() {
    const formData = new FormData();
    const fields = getFormData();
    fields.forEach(field => {
        if (field.type === 'file') {
            formData.append(field.key, field.file);
        } else {
            formData.append(field.key, field.value);
        }
    });
    return formData;
}

function initCurlUpdate() {
    const urlInput = document.getElementById('url');
    const methodSelect = document.getElementById('method');
    const bodyTypeSelect = document.getElementById('body-type');
    const bodyTextarea = document.getElementById('body');

    urlInput.addEventListener('input', updateCurlPreview);
    methodSelect.addEventListener('change', updateCurlPreview);
    bodyTypeSelect.addEventListener('change', updateCurlPreview);
    bodyTextarea.addEventListener('input', updateCurlPreview);

    const proxyEnabled = document.getElementById('proxy-enabled');
    const proxyUrlInput = document.getElementById('proxy-url');
    proxyEnabled.addEventListener('change', updateCurlPreview);
    proxyUrlInput.addEventListener('input', updateCurlPreview);

    const headersContainer = document.getElementById('headers-container');
    headersContainer.addEventListener('input', updateCurlPreview);
}

function updateCurlPreview() {
    const curlPreview = document.getElementById('curl-preview');
    const curl = generateCurlCommand();
    curlPreview.textContent = curl;
}

function generateCurlCommand() {
    const method = document.getElementById('method').value;
    const url = document.getElementById('url').value;
    const bodyType = document.getElementById('body-type').value;
    const headers = getHeaders();

    if (!url) {
        return '# 请输入URL';
    }

    let curl = `curl -X ${method} "${url}"`;

    for (const [key, value] of Object.entries(headers)) {
        if (bodyType === 'form' && key.toLowerCase() === 'content-type') {
            continue;
        }
        curl += ` \\\n  -H "${key}: ${value}"`;
    }

    if (bodyType === 'form') {
        const fields = getFormData();
        fields.forEach(field => {
            if (field.type === 'file') {
                const ext = '.' + field.file.name.split('.').pop().toLowerCase();
                const mimeType = ALLOWED_FILE_TYPES[ext] || 'application/octet-stream';
                curl += ` \\\n  -F "${field.key}=@${field.file.name};type=${mimeType}"`;
            } else {
                curl += ` \\\n  -F "${field.key}=${field.value}"`;
            }
        });
    } else if (bodyType === 'json' || bodyType === 'text') {
        const body = document.getElementById('body').value;
        if (body && method !== 'GET' && method !== 'HEAD') {
            const escapedBody = body.replace(/'/g, "'\"'\"'").replace(/"/g, '\\"');
            curl += ` \\\n  -d "${escapedBody}"`;
        }
    }

    return curl;
}

function copyCurl() {
    const curlPreview = document.getElementById('curl-preview');
    const text = curlPreview.textContent;
    if (!text || text.startsWith('#')) {
        alert('没有可复制的 cURL 命令');
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        const copyBtn = document.querySelector('.copy-btn');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '已复制!';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('复制失败:', err);
        alert('复制失败，请手动复制');
    });
}

function toggleProxyHelp() {
    const panel = document.getElementById('proxy-help-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function isProxyEnabled() {
    return document.getElementById('proxy-enabled').checked;
}

function getProxyUrl() {
    return document.getElementById('proxy-url').value.trim();
}

function buildProxyRequestUrl(targetUrl) {
    const proxyUrl = getProxyUrl();
    if (!proxyUrl) return targetUrl;
    return proxyUrl;
}

async function sendRequest() {
    const method = document.getElementById('method').value;
    const url = document.getElementById('url').value;
    const bodyType = document.getElementById('body-type').value;
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
            headers: { ...headers }
        };

        const useProxy = isProxyEnabled();
        let fetchUrl = url;

        if (useProxy) {
            fetchUrl = buildProxyRequestUrl(url);
            options.headers['x-proxy-url'] = url;
        }

        if (bodyType === 'form') {
            Object.keys(options.headers).forEach(key => {
                if (key.toLowerCase() === 'content-type') {
                    delete options.headers[key];
                }
            });
            options.body = buildFormData();
        } else if (method !== 'GET' && method !== 'HEAD') {
            const body = document.getElementById('body').value;
            if (body) {
                options.body = body;
            }
        }

        const response = await fetch(fetchUrl, options);
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);

        let responseText = '';
        const responseClone = response.clone();

        try {
            const jsonData = await response.json();
            responseText = JSON.stringify(jsonData, null, 2);
        } catch (e) {
            responseText = await responseClone.text();
        }

        statusEl.textContent = `状态: ${response.status} ${response.statusText}`;
        timeEl.textContent = `时间: ${duration} ms`;
        responseBodyEl.textContent = responseText;

        let headersText = '';
        response.headers.forEach((value, key) => {
            if (key !== 'access-control-allow-origin' && key !== 'access-control-allow-headers' && key !== 'access-control-allow-methods' && key !== 'access-control-expose-headers') {
                headersText += `${key}: ${value}\n`;
            }
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

        let errorMessage = `请求失败: ${error.message}`;
        if (error.message.includes('Failed to fetch')) {
            errorMessage += '\n\n可能的原因：';
            errorMessage += '\n1. 目标API没有正确的CORS配置，浏览器阻止了跨域请求';
            errorMessage += '\n2. 网络连接失败或服务器不可达';
            errorMessage += '\n3. 请求被浏览器扩展（如广告拦截器）阻止';
            errorMessage += '\n4. SSL证书问题（HTTPS请求）';
            errorMessage += '\n\n提示: 勾选"代理模式"并运行 node proxy.js 可绕过CORS限制';
        }
        responseBodyEl.textContent = errorMessage;
        statusEl.style.color = '#f44336';
    }
}
