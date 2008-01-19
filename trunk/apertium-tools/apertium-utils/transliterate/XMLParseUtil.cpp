#include <XMLParseUtil.h>

#include <cstdlib>
#include <iostream>

using namespace std;

wstring
XMLParseUtil::attrib(xmlTextReaderPtr reader, wstring const &name)
{
  string mystr = "";
  for(int i = 0, limit = name.size(); i != limit; i++)
  {
    mystr += static_cast<char>(name[i]);
  }
 
  xmlChar *attrname = xmlCharStrdup(mystr.c_str());
  xmlChar *myattr = xmlTextReaderGetAttribute(reader, attrname);
  wstring result = towstring(myattr);
  xmlFree(myattr);
  xmlFree(attrname);
  return result;
}

string
XMLParseUtil::latin1(xmlChar const *input)
{
 if(input == NULL)
  {
    return "";
  }

  int outputlen = xmlStrlen(input) + 1;
  int inputlen = xmlStrlen(input);

  unsigned char output[outputlen];
  
  if(UTF8Toisolat1(output, &outputlen, input, &inputlen) != 0)
  {
  }

  output[outputlen] = 0;
  string result = reinterpret_cast<char *>(output);
  return result;  
}

wstring
XMLParseUtil::towstring(xmlChar const * input)
{ 
  wstring result = L"";
  
  for(int i = 0, limit = xmlStrlen(input); i != limit; i++)
  {
    int val = 0;
    if(((unsigned char) input[i] & 0x80) == 0x0)
    {
      val = static_cast<wchar_t>(input[i]);
    }
    else if(((unsigned char) input[i] & 0xE0) == 0xC0)
    {
      val = (input[i] & 0x1F) << 6;
      i++;
      val += input[i] & 0x7F;  
    }
    else if(((unsigned char) input[i] & 0xF0) == 0xE0)
    {
      val = (input[i] & 0x0F) << 6;
      i++;
      val += input[i] & 0x7F;
      val = val << 6;
      i++;
      val += input[i] & 0x7F;
    }
    else if(((unsigned char) input[i] & 0xF8) == 0xF0)
    {
      val = (input[i] & 0x07) << 6;
      i++;
      val += input[i] & 0x7F;
      val = val << 6;
      i++;
      val += input[i] & 0x7F;
      val = val << 6;
      i++;
      val += input[i] & 0x7F;
    }
    else
    {
      wcerr << L"UTF-8 invalid string" << endl;
      exit(EXIT_FAILURE);  
    }
    
    result += static_cast<wchar_t>(val);
  }
  return result;
}

wstring 
XMLParseUtil::stows(string const &str)
{
  wchar_t result[str.size()];
  mbstowcs(result, str.c_str(), str.size());
  wstring result2 = result;
  return result2;
}
