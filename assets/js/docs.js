$(function () {

  var base = WORLDSKILLS_API_DOCS;
  
  function buildProperties(type, definitions, properties, path) {

    if (typeof definitions != 'undefined') {

      $.each(definitions, function (name, definition) {

        if ('#/definitions/' + name == type) {

          $.each(definition.properties, function (name, property) {
            if ($.inArray(name, definition.required) !== -1) {
              property.required = true;
            } else {
              property.required = false;
            }
            properties[path + name] = property;
            if (typeof property.$ref != 'undefined') {
              properties = buildProperties(property.$ref, definitions, properties, path + name + '.');
            }
            if (typeof property.items != 'undefined' && property.items.$ref != type) {
              properties = buildProperties(property.items.$ref, definitions, properties, path + name + '[].');
            }
          });
        }
      });
    }

    return properties;
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

          $.each(definition.properties, function (name, property) {

            if (optional || $.inArray(name, definition.required) !== -1) {
              if (typeof property.type != 'undefined') {
                example[name] = buildExample(property.type, definitions, optional);            
              }
              if (typeof property.$ref != 'undefined') {
                example[name] = buildExample(property.$ref, definitions, optional);
              }
              if (typeof property.items != 'undefined' && property.items.$ref != type) {
                example[name].push(buildExample(property.items.$ref, definitions, optional));
              }
            }
          });
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

        $.each(operation.tags, function (i, tagName) {

            $.each(swagger.tags, function (j, tag) {

                if (tag.name == tagName) {
                    tag.operations.push(operation);
                }
            });
        });

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
            operation.properties = buildProperties(parameter.schema.$ref, swagger.definitions, {}, '');
            operation.example = JSON.stringify(buildExample(parameter.schema.$ref, swagger.definitions, false));
          }
        });

        $.each(operation.responses, function (code, response) {

            if (typeof response.schema != 'undefined' && typeof response.schema.$ref != 'undefined') {
                response.properties = buildProperties(response.schema.$ref, swagger.definitions, {}, '');
                response.example = JSON.stringify(buildExample(response.schema.$ref, swagger.definitions, true), null, 4);
            }
        });
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
