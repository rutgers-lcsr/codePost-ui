from rest_framework import serializers

class ModelSerializerWithPOSTCheck(serializers.ModelSerializer):

  def createForPOSTCheck(self):
    '''
    Use the POST_permissions_fields field to infer which fields are required for permissions
    checking. If POST_permissions_fields not present, default to using all of the provided data.
    '''
    thisModel = getattr(self.Meta, 'model', None)
    POST_permissions_fields = getattr(self.Meta, 'POST_permissions_fields', None)
    if POST_permissions_fields is not None:
      forConstructor = {}
      for field_name in POST_permissions_fields:
        forConstructor[field_name] = self.validated_data[field_name]
      return thisModel(**forConstructor)

    return thisModel(**self.validated_data)