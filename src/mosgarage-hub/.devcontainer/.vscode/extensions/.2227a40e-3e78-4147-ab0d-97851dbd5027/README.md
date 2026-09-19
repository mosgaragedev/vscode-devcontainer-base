# Docker registry explorer

Explore and manage Docker Images, for private Docker Registries. 

## Features

### Add as many registries as you want

Add registry by providing url, user and password

![Add Registry](https://github.com/TqrHsn/vscode-docker-registry-explorer/raw/master/images/add_registry.png)

### Perform actions on registry entry

Refresh registry node to load changes. Delete a registry entry from the explorer.

![registry actions](https://github.com/TqrHsn/vscode-docker-registry-explorer/raw/master/images/registry_actions.png)

### List repositories/images, tags and layers

![List images, tage and layers](https://github.com/TqrHsn/vscode-docker-registry-explorer/raw/master/images/list_images_tags_layers.png)

### Hover over to view image size or layer size

![image size](https://github.com/TqrHsn/vscode-docker-registry-explorer/raw/master/images/image_size.png)
![layer size](https://github.com/TqrHsn/vscode-docker-registry-explorer/raw/master/images/layer_size.png)

### Perform actions on image tags

- Pull image to local docker host
- Remove image from local docker host
- Delete image from remote repository (user needs to have write access to registry for this action)

![tag actions](https://github.com/TqrHsn/vscode-docker-registry-explorer/raw/master/images/tag_actions.png)

## Requirements

No other requirements.

## Release Notes

- [Docker API V2](https://docs.docker.com/registry/spec/api/) based registries are supported only.
- For now only [Basic Authentication](https://swagger.io/docs/specification/authentication/basic-authentication/)  is supported.

