const fs = require('fs');
const path = require('path');


const apacheConfigPath = '/etc/apache2/other/local-domains.conf';

const addDomainToApacheConfig = (domain, port) => {
    const virtualHostConfig = 
`<VirtualHost *:80>
  ServerName ${domain}
  ProxyRequests Off
  <Proxy *>
    Order deny,allow
    Allow from all
  </Proxy>
  ProxyPass / http://127.0.0.1:${port}/
  ProxyPassReverse / http://127.0.0.1:${port}/
</VirtualHost>`;
    
    return `echo '${virtualHostConfig}' | sudo tee -a ${apacheConfigPath}`;
}

const editDomainInApacheConfig = async (oldDomain, newDomain, newPort) => {
    try {
        let configContent = await fs.promises.readFile(apacheConfigPath, { encoding: 'utf-8' });
        const domainConfigRegex = new RegExp(`(<VirtualHost \\*:80>\\s+ServerName ${oldDomain}\\s+.*?ProxyPass / http://127\\.0\\.0\\.1:)(\\d+)(.*?ProxyPassReverse / http://127\\.0\\.0\\.1:\\d+/.*?</VirtualHost>)`, 'gs');
        let updatedConfigContent = configContent.replace(domainConfigRegex, `$1${newPort}$3`).replace(`ServerName ${oldDomain}`, `ServerName ${newDomain}`);

        return `printf '%s' '${updatedConfigContent.replace(/'/g, "'\\''")}' | sudo tee ${apacheConfigPath}`;
    } catch (error) {
        console.error('Error editing domain in Apache config:', error);
    }
};

const removeDomainFromApacheConfig = async (domain) => {
    try {
        let configContent = await fs.promises.readFile(apacheConfigPath, { encoding: 'utf-8' });
        const pattern = `(\\n?)<VirtualHost \\*:80>\\s*ServerName ${domain}\\s*ProxyRequests Off.*?<\\/VirtualHost>(\\n?)`;
        const domainConfigRegex = new RegExp(pattern, 's');

        let updatedConfigContent = configContent.replace(domainConfigRegex, function(match, p1, p2) {
            return (p1 && p2) ? '\n' : '';
        });

        return `printf '%s' '${updatedConfigContent.replace(/'/g, "'\\''")}' | sudo tee ${apacheConfigPath}`;
    } catch (error) {
        console.error('Error removing domain from Apache config:', error);
    }
}

const restartApache = () => {
    return 'apachectl restart';
}

module.exports = { addDomainToApacheConfig, editDomainInApacheConfig, removeDomainFromApacheConfig, restartApache };
