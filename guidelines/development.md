---
layout: default
title: Development guidelines
breadcrumb: Development
---

# Development guidelines

Coding guidelines and best practices for code development.

* Table of contents
{:toc}

### General
- Lines should be 120 characters or less.
- Primary functionality should be tested with integration tests.
- Complex code should be tested with unit tests.

### Java
- Code should be formatted with the WorldSkills code formatter profile for [Eclipse](/assets/xml/WSI.xml) or [IntelliJ](/assets/xml/WSI.IntelliJ.xml).
- Code must use tabs for indenting.

### PHP
- Code should follow [PSR-2: Coding Style Guide](http://www.php-fig.org/psr/psr-2/).
- Code must use 4 spaces for indenting.

### JavaScript
- Code should follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript).
- Code must use 2 spaces for indenting.
- You can use [JSCS](http://jscs.info/) to format your code
  - [linter-jscs](https://atom.io/packages/linter-jscs) for Atom
  - [jscs-fixer](https://atom.io/packages/jscs-fixer) for Atom (make sure you have a .jscsrc file with airbnb preset if using fixer)
  - because of Airbnb style says max line length is 100 - you should use a *.jscsrc* configuration file to change this
  - if you are using **TypeScript** you should also use `exludedFiles` to exclude **.js** files from the linter
  - `requireTrailingComma` should be also set to `false`

  ```
    {
      "preset": "airbnb",
      "maximumLineLength": 120,
      "requireTrailingComma": false
      "excludeFiles": ["**/*.js"]
    }
  ```

### CSS
- Code should follow [Code Guide by @mdo](http://codeguide.co/).
- Code must use 2 spaces for indenting.

### HTML
- Code should follow [Code Guide by @mdo](http://codeguide.co/).
- Code must use 2 spaces for indenting.
- HTML attributes must use double quotes, never single quotes.
