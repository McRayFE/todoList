/**
 * Created by 佳锐 on 2017/3/13.
 */
;(function(){
    $(function(){
        var $form_add_task = $('.add-task');
        var $detail_task;
        //localstorage容器
        var task_list = [];
        var $delete_task;
        var $task_detail = $('.task-detail');
        var $task_detail_mask = $('.task-detail-mask');
        var current_index;
        var $update_form;
        var $task_detail_content;
        var $task_detail_content_input;
        var $task_item;
        var $checkbox_complete;
        init();
        /*监听添加task事件*/
        $form_add_task.on('submit',on_add_task_form_submit);
        function on_add_task_form_submit(e){
                var new_task = {};
                //禁止默认行为
                e.preventDefault();
                //获取新task的值
                new_task.content = $(this).find('input[name=content]').val();
                //如果新task的值为空，则直接返回，否则继续执行
                if(!new_task.content) return;
                //存入新task的值
                if(add_task(new_task)){
                    $(this).find('input[name=content]').val('');
                }
        }
        /*查找并监听所有删除按钮的点击事件*/
        function listen_task_delete(){
            $delete_task.on('click',function(){
                var $this = $(this);
                /*找到删除按钮所在的task元素*/
                var $item = $this.parent().parent();
                /*向delete_task函数传入指定task元素的唯一data值*/
                var tmp = confirm("确认删除?");
                delete_task($item.data('index'));
            });
        }
        /*双击task-item就显示详情事件*/
        function listen_task_item(){
             $task_item.on('dblclick',function(){
                 var index = $(this).data('index');
                 detail_display(index);
             });
        }
        /*查找并监听所有详细按钮的点击事件*/
        function listen_task_detail(){
            $detail_task.on('click',function(){
                var $this = $(this);
                var $item = $this.parent().parent();
                var index = $item.data('index');
                detail_display(index);
            });
        }
        /*点击task_detail_mask后的隐藏详细事件*/
        function listen_task_detail_mask(){
            $task_detail_mask.on('click',function(){
                detail_hide();
            });
        }
        /*单选框点击事件,监听完成任务事件*/
        function listen_checkbox_complete(){
            $checkbox_complete.on('click',function(){
                /*获取单选框是否被选中*/
               var is_complete = $(this).is(':checked');
               var index = $(this).parent().parent().data('index');
               /*获得localStorage里面的task_list[index]*/
               var item  = store.get('task_list')[index];
               /*当第一次点的时候，complete为true，使得chenckbox为checked；当再次点击的时候，complete为false；*/
               if(item && item.complete){
                   update_task(index,{complete:false});
               } else{
                   update_task(index,{complete:true});
               }
            });
        }
        /*显示详细的函数*/
        function detail_display(index){
            /*生成详情模板*/
            render_task_detail(index);
            current_index = index;
            /*显示详情模板(默认隐藏)*/
            $task_detail.show();
            /*显示详情模板mask(默认隐藏)*/
            $task_detail_mask.show();
            listen_task_detail_mask();
        }
        /*隐藏详细的函数*/
        function detail_hide(){
            $task_detail.hide();
            $task_detail_mask.hide();
        }
        /*添加task函数*/
        function add_task(new_task){
            //将新task推入task_list
            task_list.push(new_task);
            //更新localStorage
            refresh_task_list();
            return true;
        }
        /*刷新localStorage并渲染tpl*/
        function refresh_task_list(){
            store.set('task_list',task_list);
            render_task_list();
        }
        /*删除一条task*/
        function delete_task(index){
            /*如果没有index或者index所在的值不存在则直接返回*/
            if(index === undefined || !task_list[index]) return;
            delete task_list[index];
            /*更新localStorage*/
            refresh_task_list();
        }
        /*初始化*/
        function init(){
            task_list = store.get('task_list') || [];
            if(task_list.length){
                render_task_list();
            }
        }
        /*渲染全部task*/
        function render_task_list(){
            var $task_list = $('.task-list');
            //console.log($task_list.html(''));
            $task_list.html('');
            /*存放完成任务的数组*/
            var complete_item = [];
            for(var i=0;i<task_list.length;i++){
                var item = task_list[i];
                if(item && item.complete){
                    /*不能用push，因为要保持存放在complete_item里面的元素的下标与原来的index相对应*/
                    complete_item[i] = item;
                } else{
                    var $task = render_task_item(task_list[i],i);
                    $task_list.prepend($task);
                }
            }
            /*另外渲染完成的任务数组*/
            for(var j=0;j<complete_item.length;j++){
                var $task = render_task_item(complete_item[j],j);
                if(!$task) continue;
                /*给完成的任务增加一个completed类，定义相应的样式*/
                $task.addClass('completed');
                /*将完成的任务插入到列表的尾部，与未完成的分隔开*/
                $task_list.append($task);
            }
            $delete_task = $('.anchor.delete');
            $detail_task = $('.anchor.detail');
            $task_item = $('.task-item');
            $checkbox_complete = $('.task-list .complete');
            listen_task_delete();
            listen_task_detail();
            listen_task_item();
            listen_checkbox_complete();
        }
        /*渲染指定task的详细信息模板*/
        function render_task_detail(index){
            if(!task_list[index] || index === undefined) return;
            var item = task_list[index];
            if(item.desc === undefined) item.desc = '';
            var detail_tpl =
                '<form>'+
                '<div class="content">'+(item.content||'undefined')+
                '</div>'+
                '<div class="input-item">'+
                '<input style="display:none;" type="text" name="content" value="'+(item.content||'undefined')+'">'+
                '</div>'+
                '<div>'+
                '<div class="desc input-item">'+
                '<textarea name="desc" name="desc" >'+item.desc+'</textarea>'+
                '</div>'+
                '<div class="remind input-item">'+
                '<input name="date" type="text" value="'+item.date+'">'+
                '<div class="input-item"><button type="submit">更新</button></div>'+
                '</div>'+
                '</div>'+'</form>';
            /*清空task详情模板*/
            $task_detail.html('');
            /*添加新模板*/
            $task_detail.html(detail_tpl);
            /*选中其中的form元素，因为之后会使用其监听submit事件*/
            $update_form = $task_detail.find('form');
            $update_form.on('submit',function(e){
                e.preventDefault();
                /*获取表单中各个Input的值*/
                var data = {};
                data.content = $(this).find('[name=content]').val();
                data.desc = $(this).find('[name=desc]').val();
                data.date = $(this).find('[name=date]').val();
                /*根据获得的data,更新task详请内容*/
                update_task(index,data);
                /*更新完之后隐藏详情页*/
                detail_hide();
            });
            /*选中显示task内容的元素*/
            $task_detail_content = $update_form.find('.content');
            /*选中显示task input的元素*/
            $task_detail_content_input = $update_form.find('[name=content]');
            /*双击内容元素显示Input,然后隐藏自己*/
            $task_detail_content.on('dblclick',function(e){
                e.preventDefault();
                $task_detail_content_input.show();
                $task_detail_content.hide();
            });
        }
        /*渲染单条task模板*/
        function render_task_item(data,index){
            if(!data || !index) return;
            var list_item_tpl =
                '<div class="task-item" data-index="'+index+'">'+
                '<span><input class="complete" type="checkbox" '+(data.complete ? 'checked':'')+'></span>'+
                '<span class="task-content">' + data.content + '</span>'+
                '<span class="fr">'+
                '<span class="anchor delete"> delete</span>'+
                '<span class="anchor detail"> detail</span>'+
                    '</span>'+
                '</div>';
            return $(list_item_tpl);
        }
        /*更新Task*/
        function update_task(index,data){
            if(!index || !task_list[index]) return;
            /*将data和task_list[index]的值合并到{}对象里面*/
            /*jQuery里面的merge只合并数组*/
            task_list[index] = $.extend({},task_list[index],data);
            refresh_task_list();
            console.log(task_list[index]);
        }
    });
})();//不会污染全局作用域