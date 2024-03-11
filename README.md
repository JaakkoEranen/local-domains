# Local Domains

Local Domains is a macOS application designed to streamline the configuration of custom domains with specific ports for local development environments. This tool simplifies the process of editing Apache2 configurations and the macOS `hosts` file, enabling the use of custom domain names for local development projects.

## Features

- **Automatic Apache2 Configuration:** Easily updates Apache2 configuration files to support custom domains.
- **Simple Hosts File Management:** Directly edits the `hosts` file to map custom domain names to localhost.
- **Custom Port Mapping:** Allows the association of custom domains with specific ports, facilitating local development.
- **Intuitive Interface:** Provides a straightforward UI for the hassle-free addition, modification, and removal of domain-port mappings.

## Getting Started

### Prerequisites

- macOS operating system with administrative access.
- Apache2 installed and operational on macOS.

### Installation

Local Domains is available for download from the [Releases](https://github.com/JaakkoEranen/local-domains/releases/tag/v1.0.0) section of our GitHub repository.

1. Navigate to the Releases section to find the latest version.
2. Download the application package.
3. Install Local Domains by dragging it into your Applications folder.

### Usage

1. **Launch Local Domains** from your Applications folder.
2. **Add a Domain:** Click on the "Add Domain" button and specify your desired domain name and port number, such as `myproject.local` and `8080`.
3. **Apply the Changes:** The application automatically updates your Apache2 configuration and `hosts` file. Administrator credentials may be required to approve these changes.
4. **Access Your Site:** Open your preferred web browser and go to the custom domain (e.g., `http://myproject.local`) to view your local development site.

## License

Local Domains is released under the ISC License. By using Local Domains, you agree to accept all responsibility and liability for any damages or losses that may arise from its use.

## Disclaimer

Local Domains modifies system configuration files (`httpd.conf` and `hosts`). While the application aims to facilitate development workflows, the developers of Local Domains are not liable for any potential issues, damages, or data loss resulting from its use. Users are encouraged to back up their configuration files and understand the risks involved before making changes to their system.
