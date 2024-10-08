const fs = require('fs');
const path = require('path');

const hostsPath = '/etc/hosts';
const startComment = "# Below are the domains generated by the Local Domains application";
const endComment = "# End of the domains generated by the Local Domains application";

const addDomainToHostsFile = async (domain) => {
    let hostsContent = await fs.promises.readFile(hostsPath, { encoding: 'utf-8' });

    if (!hostsContent.includes(startComment) || !hostsContent.includes(endComment)) {
        const prefix = hostsContent.endsWith('\n') ? '' : '\n';
        hostsContent += `${prefix}${startComment}\n${endComment}`;
    }

    const endCommentIndex = hostsContent.indexOf(endComment);
    let updatedHostsContent = hostsContent.substring(0, endCommentIndex).trim() + `\n127.0.0.1 ${domain}\n` + hostsContent.substring(endCommentIndex).trim();

    if (!updatedHostsContent.endsWith('\n')) {
        updatedHostsContent += '\n';
    }

    return `echo '${updatedHostsContent.replace(/'/g, "'\\''")}' | sudo tee ${hostsPath}`;
}

const editDomainInHostsFile = async (oldDomain, newDomain) => {
    try {
        let hostsContent = await fs.promises.readFile(hostsPath, { encoding: 'utf-8' });
        const domainRegex = new RegExp(`(127\\.0\\.0\\.1\\s+)${oldDomain}\\s*`, 'g');
        let updatedHostsContent = hostsContent.replace(domainRegex, `$1${newDomain}\n`);

        return `printf '%s' '${updatedHostsContent.replace(/'/g, "'\\''")}' | sudo tee ${hostsPath}`;
    } catch (error) {
        console.error('Error editing domain in hosts file:', error);
    }
};

const removeDomainFromHostsFile = async (domain) => {
    try {
        let hostsContent = await fs.promises.readFile(hostsPath, { encoding: 'utf-8' });
        const domainRegex = new RegExp(`127.0.0.1\\s+${domain}\\s*\n?`, 'g');
        let updatedHostsContent = hostsContent.replace(domainRegex, '');
        
        const command = `printf '%s' '${updatedHostsContent.replace(/'/g, "'\\''")}' | sudo tee ${hostsPath}`;
        return command;
    } catch (error) {
        console.error('Error removing domain from hosts file:', error);
    }
}

module.exports = { addDomainToHostsFile, editDomainInHostsFile, removeDomainFromHostsFile };
