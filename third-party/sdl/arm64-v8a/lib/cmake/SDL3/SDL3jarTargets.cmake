
####### Expanded from @PACKAGE_INIT@ by configure_package_config_file() #######
####### Any changes to this file will be overwritten by the next CMake run ####
####### The input file was SDL3jarTargets.cmake.in                            ########

get_filename_component(PACKAGE_PREFIX_DIR "${CMAKE_CURRENT_LIST_DIR}/../../../" ABSOLUTE)

macro(set_and_check _var _file)
  set(${_var} "${_file}")
  if(NOT EXISTS "${_file}")
    message(FATAL_ERROR "File or directory ${_file} referenced by variable ${_var} does not exist !")
  endif()
endmacro()

####################################################################################

set_and_check(SDL3_JAR "${PACKAGE_PREFIX_DIR}/share/java/SDL3/SDL3-3.1.3.jar")

if(NOT TARGET SDL3::Jar)
  add_library(SDL3::Jar INTERFACE IMPORTED)
  set_property(TARGET SDL3::Jar PROPERTY JAR_FILE "${SDL3_JAR}")
endif()

unset(SDL3_JAR)
