const fs = require('fs');
const path = require('path');


const apacheConfigPath = '/etc/apache2/other/local-domains.conf';

const addDomainToApacheConfig = (domain, port, locations) => {
    let virtualHostConfig = 
`<VirtualHost *:80>
  ServerName ${domain}
  ProxyRequests Off
  <Proxy *>
    Order deny,allow
    Allow from all
  </Proxy>
  ProxyPass / http://127.0.0.1:${port}/
  ProxyPassReverse / http://127.0.0.1:${port}/`;

    if (locations && Array.isArray(locations)) {
        locations.forEach(location => {
            if (location.path && location.proxyPass) {
                virtualHostConfig += `
  <Location "${location.path}">
    ProxyPass "${location.proxyPass}"
  </Location>`;
            }
        });
    }

    virtualHostConfig += `
</VirtualHost>`;
    
    return `echo '${virtualHostConfig}' | sudo tee -a ${apacheConfigPath}`;
}

const editDomainInApacheConfig = async (oldDomain, newDomain, newPort, locations) => {
    try {
        let configContent = await fs.promises.readFile(apacheConfigPath, { encoding: 'utf-8' });

        // Regex löytää oikean VirtualHost-lohkon
        const domainConfigRegex = new RegExp(
            `(<VirtualHost \\*:80>[\\s\\S]*?ServerName ${oldDomain}[\\s\\S]*?ProxyPass / http:\\/\\/127\\.0\\.0\\.1:${newPort}\\/\\n[\\s\\S]*?ProxyPassReverse / http:\\/\\/127\\.0\\.0\\.1:${newPort}\\/)([\\s\\S]*?)(\\n</VirtualHost>)`,
            'g'
        );

        let updatedConfigContent = configContent.replace(domainConfigRegex, (match, start, middle, end) => {
            // Poista vain olemassa olevat Location-lohkot
            const strippedMiddle = middle.replace(/<Location ".*?">[\s\S]*?<\/Location>/g, '').trim();

            // Luo uudet Location-lohkot annetuista locations-tiedoista
            const locationConfigs = locations
                .map(
                    loc => `
  <Location "${loc.path}">
    ProxyPass "${loc.proxyPass}"
  </Location>`
                )
                .join('');

            // Palauta sisältö ilman tyhjiä rivejä
            return `${start}${strippedMiddle}${locationConfigs}${end}`;
        });

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
