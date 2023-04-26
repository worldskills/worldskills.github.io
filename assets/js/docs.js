$(function () {

  var base = WORLDSKILLS_API_DOCS;
  
  function buildDefinitions(type, all, definitions) {

    var typeName = type;

    if (typeof definitions != 'undefined') {

      $.each(all, function (name, definition) {

        if ('#/definitions/' + name == type) {

          typeName = name;
          definitions[name] = definition;

          if (typeof definition.properties != 'undefined' && definition.properties) {

            $.each(definition.properties, function (name, property) {
              if ($.inArray(name, definition.required) !== -1) {
                property.required = true;
              } else {
                property.required = false;
              }
              if (typeof property.$ref != 'undefined' && property.$ref != type) {
                property.definition = buildDefinitions(property.$ref, all, definitions);
              }
              if (typeof property.items != 'undefined' && property.items.$ref != type) {
                property.items.definition = buildDefinitions(property.items.$ref, all, definitions);
              }
            });
          }
        }
      });
    }

    return typeName;
  }

  function buildExample(type, definitions, optional) {

    if (type == 'string') {
      return '';
    }

    if (type == 'boolean') {
      return false;
    }

    if (type == 'integer' || type == 'double' || type == 'number') {
      return 0;
    }

    if (type == 'array') {
      return [];
    }

    var example = {};

    if (typeof definitions != 'undefined') {

      $.each(definitions, function (name, definition) {

        if ('#/definitions/' + name == type) {

          if (typeof definition.properties != 'undefined' && definition.properties) {

            $.each(definition.properties, function (name, property) {

              if (optional || $.inArray(name, definition.required) !== -1) {
                if (typeof property.xml != 'undefined' && property.xml && typeof property.xml.name != 'undefined') {
                  name = property.xml.name;
                }
                if (typeof property.type != 'undefined') {
                  example[name] = buildExample(property.type, definitions, optional);            
                }
                if (typeof property.$ref != 'undefined' && property.$ref != type) {
                  example[name] = buildExample(property.$ref, definitions, optional);
                }
                if (typeof property.items != 'undefined' && property.items.$ref != type) {
                  example[name].push(buildExample(property.items.$ref, definitions, optional));
                }
              }
            });
          }
        }
      });
    }

    return example;
  }

  function sanitize(text) {
    var value = text.replace(/[\s!@#$%^&*()_+=\[{\]};:<>|.\/?,\\'""-]/g, '-');
    value = value.replace(/((-){2,})/g, '-');
    value = value.replace(/^(-)*/g, '');
    value = value.replace(/([-])*$/g, '');
    return value;
  }

  $.get(base, function (swagger) {

    var tags = {};

    $.each(swagger.tags, function (i, tag) {
      tag.operations = [];
    });

    $.each(swagger.paths, function (path, resource) {

      $.each(resource, function (method, operation) {
        if (operation) {
          if (typeof operation.tags !== 'undefined' && $.isArray(operation.tags)) {

            $.each(operation.tags, function (i, tagName) {

                $.each(swagger.tags, function (j, tag) {

                    if (tag.name == tagName) {
                        tag.operations.push(operation);
                    }
                });
            });
          }

          operation.path = path;
          operation.method = method.toUpperCase();

          operation.label = 'default';
          if (method == 'get') {
            operation.label = 'success';
          }
          if (method == 'post') {
            operation.label = 'info';
          }
          if (method == 'put') {
            operation.label = 'warning';
          }
          if (method == 'delete') {
            operation.label = 'danger';
          }

          operation.id = sanitize(path + ' ' + operation.operationId);

          operation.queryParams = [];
          operation.pathParams = [];
          $.each(operation.parameters, function (i, parameter) {
            if (parameter.in == 'query') {
              operation.queryParams.push(parameter);
            }
            if (parameter.in == 'path') {
              operation.pathParams.push(parameter);
            }
            if (parameter.in == 'body') {
              operation.definitions = {};
              buildDefinitions(parameter.schema.$ref, swagger.definitions, operation.definitions);
              operation.example = JSON.stringify(buildExample(parameter.schema.$ref, swagger.definitions, false));
            }
          });

          $.each(operation.responses, function (code, response) {

              if (typeof response.schema != 'undefined' && response.schema && typeof response.schema.$ref != 'undefined') {
                response.definitions = {};
                buildDefinitions(response.schema.$ref, swagger.definitions, response.definitions);
                response.example = JSON.stringify(buildExample(response.schema.$ref, swagger.definitions, true), null, 2);
              }
          });
        }
      });
    });

    // render API nav
    $.each(swagger.tags, function (i, tag) {

        $('.sidebar .list-unstyled').append('<li><a href="#' + tag.name + '">' + tag.name + '</a></li>');

        $.each(tag.operations, function (i, operation) {

          $('.sidebar .list-unstyled').append('<li><a href="#' + operation.id + '"><small>&nbsp;&nbsp;&nbsp;' + operation.method + ' ' + swagger.basePath + operation.path + '</small></a></li>');

        });
    });

    // render API content
    var source = $('#api-template').html();
    var template = Handlebars.compile(source);

    var context = {swagger: swagger};
    var html = template(context);

    $('#api').html(html);
  });
});
