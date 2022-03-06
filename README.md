```console

                             __      __  ____           ____                   __                    
                            /\ \  __/\ \/\  _`\        /\  _`\          __    /\ \                   
                            \ \ \/\ \ \ \ \ \L\ \      \ \ \L\ \  _ __ /\_\   \_\ \     __      __   
                             \ \ \ \ \ \ \ \ ,__/_______\ \  _ <'/\`'__\/\ \  /'_` \  /'_ `\  /'__`\ 
                              \ \ \_/ \_\ \ \ \//\______\\ \ \L\ \ \ \/ \ \ \/\ \L\ \/\ \L\ \/\  __/ 
                               \ `\___x___/\ \_\\/______/ \ \____/\ \_\  \ \_\ \___,_\ \____ \ \____\
                                '\/__//__/  \/_/           \/___/  \/_/   \/_/\/__,_ /\/___L\ \/____/
                                                                                        /\____/      
                                                                                        \_/__/       
                                         
                                         
                                       ~Bridging content from WordPress to Arweave network~

```


## Synopsis
the `wp-bridge` allow for WordPress users to archive their blog's database permanently on Arweave without worrying about continious storage costs, data loss, and censorship.

## Install
```sh
npm install -g wp-bridge
```

## Examples

### create a profile & sign in

```sh
wp-bridge sign-up --key-file PATH-TO-YOUR-WALLET.json --wallet-name NAME-LABEL
```

### deploy registry contract

```sh
wp-bridge deploy-contract --blog-name ExampleBlog --blog-url https://your-wp-blog.net
```

### check your profile

```sh
wp-bridge profile
```

### check if a domain is using Wordpress

```sh
wp-bridge is-wordpress --domain DomainNameAndTLD
```

### fetch content and archive diffs

```sh
wp-bridge fetch-content
```

### load registry-contract state

```sh
wp-bridge read-registry

```

### signing out

```sh
wp-bridge sign-out
```

### signing in

```sh
wp-bridge sign-in --key-file PATH-TO-YOUR-WALLET.json
```

## License
This project is licensed under the [MIT license](./LICENSE)
